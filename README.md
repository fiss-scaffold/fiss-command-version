# fiss-command-version

## 用法

### 显示当前组件版本:
```bash
fiss version
```

### 更新组件版本号:
```bash
fiss version [releaseType]
```
`releaseType`:
+ `major`: 更新major版本号(比如`1.0.0`->`2.0.0`)
+ `minor`: 更新minor版本号(比如`1.0.0`->`1.1.0`)
+ `patch`: 更新patch版本号(比如`1.0.0`->`1.0.1`)

## 说明
**更新版本仅在本地提交代码和创建`tag`，需要执行`git push --tags`将代码同步到远程仓库**
