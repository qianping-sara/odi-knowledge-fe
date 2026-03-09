# odi-knowledge-fe

```sh
docker build -t odi-knowledge-fe .

# eg. BACKEND_BASE_URL=https://odi-knowledge-backend.vercel.app
# eg. BACKEND_BASE_URL=http://host.docker.internal:8000

docker run --rm \
  -p 3000:3000 \
  -e BACKEND_BASE_URL=https://odi-knowledge-backend.vercel.app \
  --name odi-knowledge-fe \
  odi-knowledge-fe

# or
docker run --rm \
  -p 3000:3000 \
  --env-file ./.env \
  --name odi-knowledge-fe \
  odi-knowledge-fe

```
