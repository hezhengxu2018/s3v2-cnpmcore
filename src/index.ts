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
    return key;
  }

  async upload(file: string | Buffer, options: UploadOptions) {
    const _key = this.trimKey(options.key);
    if (typeof file === "string") {
      file = await fs.readFile(file);
    }
    await this.s3
      .putObject({ Bucket: this.config.bucket, Key: _key, Body: file, ContentLength: options.size })
      .promise();
    return { key: options.key };
  }

  async uploadBytes(bytes: string | Buffer, options: UploadOptions) {
    if (typeof bytes === "string") {
      bytes = Buffer.from(bytes);
    }
    return await this.upload(bytes, options);
  }

  async appendBytes(bytes: Uint8Array | string, options: AppendOptions) {
    const _key = this.trimKey(options.key);
    if (typeof bytes === "string") {
      bytes = Buffer.from(bytes);
    }
    const oldBytes = await this.readBytes(_key);
    if (oldBytes) {
      const oldBuffer = new Uint8Array(oldBytes);
      const newBytes = Buffer.concat([oldBuffer, Buffer.from(bytes)]);
      await this.remove(options.key);
      return await this.uploadBytes(newBytes, options);
    } else {
      const newBytes = Buffer.from(bytes);
      await this.remove(options.key);
      return await this.uploadBytes(newBytes, options);
    }
  }

  async readBytes(key: string) {
    const _key = this.trimKey(key);
    try {
      return (await this.s3.getObject({ Bucket: this.config.bucket, Key: _key }).promise()).Body as Buffer;
    } catch (error) {
      return undefined;
    }
  }

  async download(key: string, savePath: string) {
    const _key = this.trimKey(key);
    const res = (await this.s3.getObject({ Bucket: this.config.bucket, Key: _key }).promise()).Body as Buffer;
    await fs.writeFile(savePath, res);
  }

  async createDownloadStream(key: string) {
    const _key = this.trimKey(key);
    try {
      await this.s3.headObject({ Bucket: this.config.bucket, Key: _key }).promise();
    } catch (error) {
      if ((error as AWSError).statusCode === 404) {
        return undefined;
      } else {
        throw error;
      }
    }
    return this.s3.getObject({ Bucket: this.config.bucket, Key: _key }).createReadStream();
  }

  async remove(key: string) {
    const _key = this.trimKey(key);
    await this.s3.deleteObject({ Bucket: this.config.bucket, Key: _key }).promise();
  }

  async list(prefix: string) {
    const _prefix = this.trimKey(prefix);
    const fileList = (await this.s3.listObjectsV2({ Bucket: this.config.bucket, Prefix: _prefix }).promise()).Contents;
    return fileList?.map((item) => {
      return item.Key?.split(`${_prefix}/`)[1];
    });
  }

  async url(key: string) {
    const _key = this.trimKey(key);
    return `${this.config.endpoint}/${this.config.bucket}/${_key}`;
  }
}

export default S3v2Client;
