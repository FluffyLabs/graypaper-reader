import type { ISynctexBlock, ISynctexBlockId } from "@fluffylabs/links-metadata";
import {
  type Dispatch,
  type MouseEventHandler,
  type MutableRefObject,
  type ReactNode,
  type SetStateAction,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import { subtractBorder } from "../../utils/subtractBorder";
import { CodeSyncContext, type ICodeSyncContext } from "../CodeSyncProvider/CodeSyncProvider";
import { type ILocationContext, LocationContext } from "../LocationProvider/LocationProvider";
import {usePrevious} from "../../hooks/usePrevious";

export interface ISelectionContext {
  selectionString: string;
  setSelectionString: Dispatch<SetStateAction<string>>;
  selectedBlocks: ISynctexBlock[];
  pageNumber: number | null;
  lastScrolledTo: MutableRefObject<ISynctexBlockId | null>;
  handleViewerMouseUp: MouseEventHandler;
  handleClearSelection: () => void;
}

interface ISelectionProviderProps {
  children: ReactNode;
}

export const SelectionContext = createContext<ISelectionContext | null>(null);

// todo: solve the problem of multi-page selections

export function SelectionProvider({ children }: ISelectionProviderProps) {
  const { locationParams, setLocationParams, synctexBlocksToSelectionParams } = useContext(
    LocationContext,
  ) as ILocationContext;
  const { getSynctexBlockAtLocation, getSynctexBlockRange } = useContext(CodeSyncContext) as ICodeSyncContext;
  const [selectionString, setSelectionString] = useState<string>("");
  const lastScrolledTo = useRef<ISynctexBlockId | null>(null);

  const handleClearSelection = useCallback(() => {
    const { selectionStart, selectionEnd, ...otherParams } = locationParams;
    setLocationParams(otherParams);
    window.getSelection()?.empty();
    lastScrolledTo.current = null;
  }, [setLocationParams, locationParams]);

  // reset scroll position when version changes.
  const previousVersion = usePrevious(locationParams.version);
  useEffect(() => {
    if (previousVersion !== locationParams.version) {
      lastScrolledTo.current = null;
    }
  }, [previousVersion, locationParams]);


  const handleViewerMouseUp = useCallback(() => {
    const selection = document.getSelection();

    if (!selection || !selection.anchorNode) {
      handleClearSelection();
      return;
    }

    const anchorElement = "closest" in selection.anchorNode ? selection.anchorNode : selection.anchorNode.parentElement;
    const focusElement =
      selection.focusNode && "closest" in selection.focusNode
        ? selection.focusNode
        : selection.focusNode?.parentElement;

    if (!anchorElement) return;

    const pageElement = (anchorElement as Element).closest(".page") as HTMLElement;
    const endPageElement = focusElement ? ((focusElement as Element).closest(".page") as HTMLElement) : null;

    if ((endPageElement && pageElement !== endPageElement) || !pageElement) {
      window.getSelection()?.empty();
      return;
    }

    const pageRect = subtractBorder(pageElement.getBoundingClientRect(), pageElement);
    const pageNumber = Number.parseInt(pageElement.dataset.pageNumber || "");
    const synctexBlocks = [];

    for (const rect of selection.getRangeAt(0).getClientRects()) {
      if (rect.width === 0 || rect.height === 0) continue;

      const synctexBlock = getSynctexBlockAtLocation(
        (rect.left + rect.width / 2 - pageRect.left) / pageRect.width,
        (rect.top + rect.height / 2 - pageRect.top) / pageRect.height,
        pageNumber,
      );

      if (synctexBlock && synctexBlocks.indexOf(synctexBlock) === -1) {
        synctexBlocks.push(synctexBlock);
      }
    }

    if (!synctexBlocks.length) return;

    const newLocation = {
      ...locationParams,
      ...synctexBlocksToSelectionParams(synctexBlocks),
    };
    // since the selection comes from the user we want to suppress
    // auto-scrolling that would happen otherwise.
    lastScrolledTo.current = newLocation.selectionStart;
    setLocationParams(newLocation);
  }, [
    setLocationParams,
    locationParams,
    handleClearSelection,
    getSynctexBlockAtLocation,
    synctexBlocksToSelectionParams,
  ]);

  const selectedBlocks: ISynctexBlock[] = useMemo(() => {
    if (locationParams.selectionStart && locationParams.selectionEnd) {
      return getSynctexBlockRange(locationParams.selectionStart, locationParams.selectionEnd);
    }
    return [];
  }, [getSynctexBlockRange, locationParams]);

  const pageNumber: number | null = useMemo(() => {
    return selectedBlocks[0]?.pageNumber || null;
  }, [selectedBlocks]);

  const context = {
    selectionString,
    setSelectionString,
    selectedBlocks,
    pageNumber,
    lastScrolledTo,
    handleViewerMouseUp,
    handleClearSelection,
  };

  return <SelectionContext.Provider value={context}>{children}</SelectionContext.Provider>;
}
