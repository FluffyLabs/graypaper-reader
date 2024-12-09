export interface ISynctexBlockId {
  pageNumber: number;
  index: number;
}

export interface ISynctexJson {
  files: {
    [key: string]: string;
  };
  pages: {
    [key: string]: ISynctexBlock[];
  };
}

export interface ISynctexData {
  filePathsByFileId: Map<number, string>;
  blocksByPage: Map<number, ISynctexBlock[]>;
  blocksByFileIdAndLine: Map<number, Map<number, ISynctexBlock[]>>;
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
