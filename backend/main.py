from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from backend.config import APP_TITLE, APP_TOKEN
from backend.database import init_db
from backend.routers import words, checkin, audio

app = FastAPI(title="识字打卡工具", version="1.0.0")

# 允许前端开发服务器跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Token 鉴权中间件
@app.middleware("http")
async def token_auth(request: Request, call_next):
    path = request.url.path
    # 公开路径：健康检查、静态资源
    if path.startswith("/api/health") or path.startswith("/assets") or path.startswith("/uploads"):
        return await call_next(request)
    # 带 token 前缀的路径：去掉前缀后继续
    if path.startswith(f"/t/{APP_TOKEN}"):
        request.scope["path"] = path[len(f"/t/{APP_TOKEN}"):] or "/"
        request.scope["raw_path"] = request.scope["path"].encode()
        return await call_next(request)
    # 无 token 的 API 请求：拒绝
    if path.startswith("/api/"):
        return JSONResponse(status_code=401, content={"detail": "unauthorized"})
    # 无 token 的页面请求：返回空白页提示
    return JSONResponse(status_code=401, content={"detail": "unauthorized"})


# 注册 API 路由
app.include_router(words.router)
app.include_router(checkin.router)
app.include_router(audio.router)

# 挂载音频上传文件
UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"

# 挂载前端 assets 静态资源
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/config")
def get_config():
    return {"title": APP_TITLE}

@app.get("/")
@app.get("/{full_path:path}")
def serve_frontend(full_path: str = ""):
    """为所有非 API 路径提供前端 SPA 入口页面"""
    # 优先返回实际存在的静态文件
    if full_path:
        target = FRONTEND_DIST / full_path
        if target.is_file():
            return FileResponse(str(target))
    index_file = FRONTEND_DIST / "index.html"
    if not index_file.exists():
        return {"error": "前端尚未构建，请先在 frontend 目录执行 npm run build"}
    return FileResponse(str(index_file))
