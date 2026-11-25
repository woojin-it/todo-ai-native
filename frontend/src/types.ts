/** 할 일 한 건. 지금은 React 상태에만 있고 서버·DB에 저장하지 않는다. */
export interface Todo {
  id: string
  text: string
  completed: boolean
}
