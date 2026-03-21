export interface DuffelResponse<T> {
  data: T;
  warnings?: DuffelWarning[];
}

export interface DuffelWarning {
  type: string;
  title: string;
  message: string;
  code: string;
}

export interface DuffelError {
  meta: { status: number; request_id: string };
  errors: Array<{
    type: string;
    title: string;
    message: string;
    code: string;
  }>;
}
