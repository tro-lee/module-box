"use module";

import { useState } from "react";

function useStore() {
  const [name, setName] = useState("world");
  return { name, setName };
}

function Button({ onClick, name }: { onClick: () => void; name: string }) {
  if (name === "world") {
    return <button onClick={onClick}>Hello {name}</button>;
  }
  return <button onClick={onClick}>Hello {name}</button>;
}

/**
 * @moudle Demo
 */
function Demo() {
  const { name, setName } = useStore();
  return (
    <div>
      <Button onClick={() => {}} name={name} />
    </div>
  );
}

export default Demo;




/**
 * 
 */
function Demo() {***}


/**
 * 
 */
function DemoA() {***}