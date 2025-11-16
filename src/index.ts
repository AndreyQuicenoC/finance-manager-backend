import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.error(`Server is running on port ${PORT}`);
});
