export interface IClickInfo {
  id: string;
  clicks: number;
}

export type ServerResponse<T = any> =
  | {
      error: false;
      data: T;
    }
  | {
      error: true;
      data: string;
    };
