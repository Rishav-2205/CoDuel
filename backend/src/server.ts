import app from "./app";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Coding Duel Server] Listening on port ${PORT}`);
  console.log(`[Coding Duel Server] Health check: http://localhost:${PORT}/api/health`);
});
