# core


## 层次管理


entry 调用 - transform: 用于翻译成所用的
          - 
          - parse: 用于解析特定对象
          - parseTypeAnnotation parseJSXElement 解析类型注解 和 解析jsx语句
          -
          - context: 处理上下文管理，给个上下文和路由，就可以打通import
          - getFunctionDeclartionByContext getInterfaceDelartionByContext 获取函数和接口的声明语句
          - 
          - ast 解析出上下文
          -