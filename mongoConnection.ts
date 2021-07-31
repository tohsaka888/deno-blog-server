import {
  Bson,
  MongoClient,
  Database,
  Collection,
} from "https://deno.land/x/mongo@v0.24.0/mod.ts";

// 连接和数据库操作需要异步处理
const client = new MongoClient();
await client.connect("mongodb://139.196.141.233/:27017/");

// 定义数据类型
type Article = {
  _id?: { $oid: string };
  title: string;
  tags: string[];
  intro: string;
};

// 选择数据库
const db: Database = client.database("blog");

// 选择数据库中的集合
const articleCollection: Collection<Article> =
  db.collection<Article>("articles");

// 查询操作(所有)
const searchArticle = async () => {
  return await articleCollection.find({}).toArray();
};

// 更新操作
const updateOneArticle = async (article: Article, id?: Bson.ObjectId) => {
  const res = await articleCollection.updateOne({ _id: id }, { $set: article });
  console.log(res);
};

// 插入操作
const insertArticle = async (
  article: Article
): Promise<Bson.Document | Error> => {
  const id: Bson.Document = await articleCollection.insertOne(article);
  return id;
};
export type { Article };
export { insertArticle, searchArticle, updateOneArticle };
