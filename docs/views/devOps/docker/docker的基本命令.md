

## 删除容器ID
docker rm -f 容器名称或ID

## 停止容器
docker stop 容器名称或ID

## 重启容器
docker restart my_container_name_or_id

## 查看容器log
docker logs 容器ID（c2ee566a13c0f98256f3442c75b153a18725433c1dab3c8fa467935e6b38526c）


## 容器中执行命令
docker exec -it 27e117dc2f49e8 bash


## 导入镜像文件
docker load -i nginx.tar

## 导出镜像文件
docker save -o nginx.tar nginx:latest


cd /etc/docker
sudo vim daemon.json

修改daemon.json
```json
{
    "registry-mirrors": [
        "https://dockerproxy.com",
        "https://hub-mirror.c.163.com",
        "https://mirror.baidubce.com",
        "https://ccr.ccs.tencentyun.com"
    ]
}
```

systemctl daemon-reload
systemctl restart docker.service