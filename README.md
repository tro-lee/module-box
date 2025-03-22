需安装依赖 tsc，bun，node 23(用于 next)

## DEBUG 篇

1. 当前可以 launch.json 配置差不多了，但是如果想 debug 某个具体的 test 任务
   输入以下指令，并运行attach Bun。
   bun test --inspect-wait=localhost:6499/ your-file
   注意：要有断点才能停下来奥🔬
