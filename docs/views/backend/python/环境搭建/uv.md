## 教程
https://www.cnblogs.com/java-six/p/18872752

## 创建虚拟环境
```bash
# 在当前目录下创建一个名为 .venv 的虚拟环境，使用系统默认的 Python 版本
uv venv

# 在当前目录下创建一个名为 my-project-env 的虚拟环境，使用指定的 Python 3.11 版本
uv venv -p python3.11 my-project-env

# 在指定路径创建一个名为 custom-env 的虚拟环境，使用 Python 3.10
uv venv -p python3.10 /path/to/my/project/custom-env

```
## 安装包
```bash
# 确保你已经激活了虚拟环境 
# Windows (CMD): .\venv\Scripts\activate
# macOS/Linux (Bash/Zsh): source venv/bin/activate

# 安装 requests 包
uv pip install requests

# 安装指定版本的 Flask 包
uv pip install Flask==2.2.2

# 从 requirements.txt 文件安装所有依赖
uv pip install -r requirements.txt

# 安装开发依赖 (通常在 requirements-dev.txt 中)
uv pip install -r requirements-dev.txt -d dev

```
## 卸载包
```bash
# 确保你已经激活了虚拟环境

# 卸载 requests 包
uv pip uninstall requests

# 卸载多个包
uv pip uninstall Flask Werkzeug

```

## 移除虚拟环境
```bash
# 删除当前目录下的名为 .venv 的虚拟环境
uv venv --remove .venv

# 删除指定路径的虚拟环境
uv venv --remove /path/to/my/project/my-project-env

```