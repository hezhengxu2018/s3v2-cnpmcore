import assert from "assert";
import path from "path";
import fs from "fs/promises";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { ClientConfiguration } from "../src/types/index";
import S3v2Client from "../src/index";
const env = process.env;
const s3Config: ClientConfiguration = {
  endpoint: env.S3_CNPMCORE_ENDPOINT,
  accessKeyId: env.S3_CNPMCORE_ID,
  secretAccessKey: env.S3_CNPMCORE_KEY,
  bucket: env.S3_CNPMCORE_BUCKET!,
};

describe("s3-cnpmcore", () => {
  const client = new S3v2Client(s3Config);

  describe("upload() uploadBytes()", () => {
    it("should upload file ok", async () => {
      let res = await client.upload(__filename, { key: "hello/upload.ts" });
      assert(res.key === "hello/upload.ts");
      res = await client.upload(__filename, { key: "/hello/a/b/hello.txt" });
      assert(res.key === "/hello/a/b/hello.txt");
    });

    it("should upload bytes OK", async () => {
      const bytesKey = "hello/cnpmcore-test-upload-bytes";
      let res = await client.uploadBytes("hello s3-cnpmcore", { key: bytesKey });
      assert.equal(res.key ,bytesKey);
      const bytes = await client.readBytes(bytesKey);
      assert(bytes);
      assert(bytes.toString() === "hello s3-cnpmcore");
      const bytesKey2 = "/hello/a/b/cnpmcore-test-upload-bytes";
      res = await client.uploadBytes("hello s3-cnpmcore", { key: bytesKey2 });
    });
  });

  describe("readBytes()", () => {
    it("should get bytes ok", async () => {
      await client.uploadBytes("hello bytes", { key: "hello/test-read-bytes.tgz" });
      const bytes = await client.readBytes("hello/test-read-bytes.tgz");
      assert.equal(bytes?.toString(), "hello bytes");
    });

    it("should return undefined when file not exist", async () => {
      const bytes = await client.readBytes("hello/file-not-exists.tgz");
      assert.equal(bytes, undefined);
    });
  });

  describe("appendBytes()", () => {
    it("should append ok", async () => {
      await client.remove("hello/bar.txt")
      let res = await client.appendBytes("hello", { key: "hello/bar.txt" });
      assert(res.key === "hello/bar.txt");
      const bytes1 = (await client.readBytes(res.key))?.toString('utf8')
      assert.equal(bytes1, "hello");
      res = await client.appendBytes(" world", { key: "hello/bar.txt" });
      assert(res.key === "hello/bar.txt");
      const bytes2 = (await client.readBytes(res.key))?.toString()
      assert.equal(bytes2, "hello world");
      res = await client.appendBytes("\nagain", { key: "hello/bar.txt" });
      assert(res.key === "hello/bar.txt");
      assert.equal((await client.readBytes(res.key))?.toString(), "hello world\nagain");
    });
  });

  describe("download()", () => {
    it("should download ok", async () => {
      await client.uploadBytes("hello", { key: "hello/download-foo.tgz" });
      const dest = path.join(__dirname, "world");
      await client.download("hello/download-foo.tgz", dest);
      assert.equal(await fs.readFile(dest, "utf8"), "hello");
      await fs.unlink(dest);
    });
  });

  describe("createDownloadStream()", () => {
    it("should get download stream ok", async () => {
      await client.uploadBytes("hello bar", { key: "hello/download-bar.tgz" });
      const dest = path.join(__dirname, "hello");
      const stream = await client.createDownloadStream("hello/download-bar.tgz");
      const writeStream = createWriteStream(dest);
      stream && await pipeline(stream, writeStream);
      assert.equal(await fs.readFile(dest, "utf8"), "hello bar");
    });

    it("should get undefined when file not exists", async () => {
      const stream = await client.createDownloadStream("hello/file-not-exists.bar");
      assert.equal(stream, undefined);
    });
  });

  describe("remove()", () => {
    it("should remove ok", async () => {
      await client.uploadBytes("hello bar", { key: "hello/download-bar.tgz" });
      await client.uploadBytes("hello bar", { key: "/foo/-/foo-1.3.2.txt" });
      await client.remove("hello/download-bar.tgz");
      await client.remove("/foo/-/foo-1.3.2.txt");
      await client.remove("not-exists-dir/foo/-/foo-1.3.2.txt");
      assert.equal(await client.readBytes("hello/download-bar.tgz"), undefined);
      assert.equal(await client.readBytes("foo/-/foo-1.3.2.txt"), undefined);
    });
  });

  describe("list()", () => {
    it("should list ok", async () => {
      await client.upload(__filename, { key: "hello2222/upload.js" });
      const files = await client.list("hello2222");
      assert.deepStrictEqual(files, ["upload.js"]);
    });
  });
});
