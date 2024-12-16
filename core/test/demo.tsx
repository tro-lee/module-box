import { foo, Props } from "./foo";

export default function Demo() {
  // @ts-ignore
  return <div>Hello, world!</div>;
}

interface DemoProps {
  name: string;
}

/**
 * @module foo
 */

/**
 * @module bar
 * @description 这是bar
 * @param {Props} props - 这是props
 */
function bar() {
  return <div>Hello, world!</div>;
}

/**
 * @module demo
 * @description 这是demo
 * @param {Props}
 */
export function DemoA(props: Props) {
  // @ts-ignore
  return <div>Hello, world!</div>;
}
