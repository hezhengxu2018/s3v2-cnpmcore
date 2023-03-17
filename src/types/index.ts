import S3 from "aws-sdk/clients/s3";
export interface UploadOptions {
  key: string;
  size?: number;
}

export interface AppendOptions {
  key: string;
}

export interface UploadResult {
  key: string;
}

export interface ClientConfiguration extends S3.Types.ClientConfiguration {
  endpoint: string;
  bucket: string;
}
