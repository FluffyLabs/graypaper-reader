import {
  type MouseEventHandler,
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { subtractBorder } from "../../utils/subtractBorder";
import { CodeSyncContext, type ICodeSyncContext, type ISynctexBlock } from "../CodeSyncProvider/CodeSyncProvider";
import { type ILocationContext, LocationContext } from "../LocationProvider/LocationProvider";

export interface ISelectionContext {
  selectionString: string;
  selectedBlocks: ISynctexBlock[];
  pageNumber: number | null;
  handleViewerMouseDown: MouseEventHandler;
  handleViewerMouseUp: MouseEventHandler;
  handleClearSelection: () => void;
}

interface ISelectionProviderProps {
  children: ReactNode;
}

export const SelectionContext = createContext<ISelectionContext | null>(null);

// todo: solve the problem of multi-page selections

export function SelectionProvider({ children }: ISelectionProviderProps) {
  const { locationParams, setLocationParams } = useContext(LocationContext) as ILocationContext;
  const [selectionString, setSelectionString] = useState<string>("");
  const [selectedBlocks, setSelectedBlocks] = useState<ISynctexBlock[]>([]);
  const [pageNumber, setPageNumber] = useState<number | null>(null);
  const { getSynctexBlockAtLocation, getSynctexBlockByPageAndIndex } = useContext(CodeSyncContext) as ICodeSyncContext;

  const handleClearSelection = useCallback(() => {
    setSelectionString("");
    setSelectedBlocks([]);
    setPageNumber(null);
  }, []);

  const handleViewerMouseDown = () => handleClearSelection();

  const handleViewerMouseUp = () => {
    const selection = document.getSelection();

    if (!selection || !selection.anchorNode) return;

    const anchorElement = "closest" in selection.anchorNode ? selection.anchorNode : selection.anchorNode.parentElement;

    if (!anchorElement) return;

    const pageElement = (anchorElement as Element).closest(".page") as HTMLElement;

    if (!pageElement) return;

    const pageRect = subtractBorder(pageElement.getBoundingClientRect(), pageElement);
    const pageNumber = Number.parseInt(pageElement.dataset.pageNumber || "");
    const synctexBlocks = [];

    for (const rect of selection.getRangeAt(0).getClientRects()) {
      const synctexBlock = getSynctexBlockAtLocation(
        (rect.left + rect.width / 2 - pageRect.left) / pageRect.width,
        (rect.top + rect.height / 2 - pageRect.top) / pageRect.height,
        pageNumber,
      );

      if (synctexBlock && synctexBlocks.indexOf(synctexBlock) === -1) {
        synctexBlocks.push(synctexBlock);
      }
    }

    setLocationParams({
      ...locationParams,
      selection: synctexBlocks.map((block) => ({ pageNumber: block.pageNumber, index: block.index })),
    });

    // setSelectionString(selection.toString());
    // setSelectedBlocks(synctexBlocks);
    // setPageNumber(pageNumber);
  };

  useEffect(() => {
    if (locationParams.selection) {
      setSelectedBlocks(
        locationParams.selection
          .map(({ pageNumber, index }) => getSynctexBlockByPageAndIndex(pageNumber, index))
          .filter((block) => block !== null),
      );
      setPageNumber(locationParams.selection[0].pageNumber);
    } else {
      handleClearSelection();
    }
  }, [locationParams.selection, getSynctexBlockByPageAndIndex, handleClearSelection]);

  const context = {
    selectionString,
    selectedBlocks,
    pageNumber,
    handleViewerMouseDown,
    handleViewerMouseUp,
    handleClearSelection,
  };

  return <SelectionContext.Provider value={context}>{children}</SelectionContext.Provider>;
}
