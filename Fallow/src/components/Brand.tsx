import { IconLeaf } from "../icons";

export function Brand({ href }: { href: string }) {
  return (
    <a className="brand" href={href}>
      <IconLeaf />
      <span>Fallow</span>
    </a>
  );
}
