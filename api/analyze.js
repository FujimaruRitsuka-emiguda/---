export default async function handler(req, res) {
  res.status(200).json({ 
    analysis: "🎉 终极成功！后端已通畅。你可以开始上传截图了。" 
  });
}
