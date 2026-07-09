# 生活记录系统网页 App 部署说明

这个文件夹 `webapp/` 是可以直接部署到 GitHub Pages 的静态网页 App。

## 一、部署到 GitHub Pages

1. 打开 GitHub，新建一个仓库，例如：`life-record-app`
2. 把 `webapp/` 文件夹里的这些文件上传到仓库根目录：
   - `index.html`
   - `styles.css`
   - `app.js`
   - `manifest.webmanifest`
   - `sw.js`
   - `.nojekyll`
3. 打开仓库的 `Settings`
4. 找到 `Pages`
5. `Build and deployment` 选择：
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
6. 保存后等待 1-3 分钟
7. GitHub 会生成一个网址，类似：

   `https://你的用户名.github.io/life-record-app/`

## 二、添加到 iPhone 主屏幕

1. 用 iPhone 的 Safari 打开上面的 GitHub Pages 网址
2. 点击 Safari 底部的“分享”按钮
3. 选择“添加到主屏幕”
4. 名称可以填写：`生活记录`
5. 点击“添加”

之后 iPhone 桌面上就会出现一个像 App 一样的入口。

## 三、关于数据保存

当前网页 App 的数据保存在 iPhone Safari 的本地浏览器存储中。

注意：

- 不同设备之间不会自动同步
- 清除 Safari 网站数据可能会删除记录
- 换手机前需要另做导出功能，当前版本还没有导出

## 四、关于提醒

网页 App 已包含每日固定待办：

- 08:30 上班打卡
- 18:00 下班打卡

iOS 对网页通知有限制：

- 需要在页面里点击“开启提醒”
- 需要允许通知权限
- 页面未打开或系统限制时，提醒可能不稳定

如果之后需要更稳定的 iPhone 提醒，建议做成真正的 iOS App 或配合 iPhone 快捷指令。
