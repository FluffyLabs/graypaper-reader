export interface ISynctexBlockId {
  pageNumber: number;
  index: number;
}

export interface ISynctexData {
  files: {
    [key: string]: string;
  };
  pages: {
    [key: string]: ISynctexBlock[];
  };
}

export interface ISynctexBlock extends ISynctexBlockId {
  fileId: number;
  line: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ISelectionParams {
  selectionStart: ISynctexBlockId;
  selectionEnd: ISynctexBlockId;
}
