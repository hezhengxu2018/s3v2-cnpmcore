import fs from "fs/promises";
import { AWSError } from "aws-sdk";
import S3 from "aws-sdk/clients/s3";
import { ClientConfiguration, UploadOptions, AppendOptions } from "./types/index";

class S3v2Client {
  config: ClientConfiguration;
  s3: S3;

  constructor(config: ClientConfiguration) {
    this.config = config;
    this.s3 = new S3(config);
  }

  trimKey(key: string) {
    key = key ? key.replace(/^\//, "") : "";
    // %3A => :
    key = key && key.indexOf("%3A") >= 0 ? decodeURIComponent(key) : key;
    return key;
  }

  async upload(file: string | Buffer, options: UploadOptions) {
    const key = this.trimKey(options.key);
    if (typeof file === "string") {
      file = await fs.readFile(file);
    }
    await this.s3
      .putObject({ Bucket: this.config.bucket, Key: key, Body: file, ContentLength: options.size })
      .promise();
    return { key: key };
  }

  async uploadBytes(bytes: string | Buffer, options: UploadOptions) {
    if (typeof bytes === "string") {
      bytes = Buffer.from(bytes);
    }
    return await this.upload(bytes, options);
  }

  async appendBytes(bytes: Uint8Array | string, options: AppendOptions) {
    const key = this.trimKey(options.key);
    if (typeof bytes === "string") {
      bytes = Buffer.from(bytes);
    }
    const oldBytes = await this.readBytes(key);
    if (oldBytes) {
      const oldBuffer = new Uint8Array(oldBytes);
      const newBytes = Buffer.concat([oldBuffer, Buffer.from(bytes)]);
      return await this.uploadBytes(newBytes, options);
    } else {
      const newBytes = Buffer.from(bytes);
      return await this.uploadBytes(newBytes, options);
    }
  }

  async readBytes(key: string) {
    key = this.trimKey(key);
    try {
      return (await this.s3.getObject({ Bucket: this.config.bucket, Key: key }).promise()).Body as Buffer;
    } catch (error) {
      return undefined;
    }
  }

  async download(key: string, savePath: string) {
    key = this.trimKey(key);
    const res = (await this.s3.getObject({ Bucket: this.config.bucket, Key: key }).promise()).Body as Buffer;
    await fs.writeFile(savePath, res);
  }

  async createDownloadStream(key: string) {
    key = this.trimKey(key);
    try {
      await this.s3.headObject({ Bucket: this.config.bucket, Key: key }).promise();
    } catch (error) {
      if ((error as AWSError).statusCode === 404) {
        return undefined;
      } else {
        throw error;
      }
    }
    return this.s3.getObject({ Bucket: this.config.bucket, Key: key }).createReadStream();
  }

  async remove(key: string) {
    key = this.trimKey(key);
    await this.s3.deleteObject({ Bucket: this.config.bucket, Key: key }).promise();
  }

  async list(prefix: string) {
    return (await this.s3.listObjectsV2({ Bucket: this.config.bucket, Prefix: prefix }).promise()).Contents;
  }

  async url(key: string) {
    key = this.trimKey(key);
    return `${this.config.endpoint}/${this.config.bucket}/${key}`;
  }
}

export default S3v2Client;
