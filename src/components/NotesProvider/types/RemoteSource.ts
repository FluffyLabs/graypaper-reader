export type IRemoteSource = {
  id: number;
  name: string;
  url: string;
  isEnabled: boolean;
  versions: string[] | null;
};
