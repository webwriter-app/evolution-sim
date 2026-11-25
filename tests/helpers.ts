export async function until<T>(what: string, condition: () => T | Promise<T>, ms = 20000): Promise<NonNullable<T>> {
  const end = performance.now() + ms;
  for (;;) {
    let value: T | undefined;
    try { value = await condition(); } catch { value = undefined; }
    if (value) return value as NonNullable<T>;
    if (performance.now() > end) throw new Error(`timed out waiting for ${what}`);
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

export function deepQuery(root: ParentNode, selector: string): Element | null {
  const found = root.querySelector(selector);
  if (found) return found;
  for (const element of root.querySelectorAll("*")) {
    if (element.shadowRoot) {
      const inner = deepQuery(element.shadowRoot, selector);
      if (inner) return inner;
    }
  }
  return null;
}

export function setEditMode(widget: HTMLElement, on: boolean) {
  if (on) {
    document.designMode = "on";
    widget.setAttribute("contenteditable", "");
  } else {
    widget.removeAttribute("contenteditable");
    document.designMode = "off";
  }
}

export function dataBlockOf(snippet: string) {
  return /<script type="application\/json" slot="data">[^<]*<\/script>/.exec(snippet)![0];
}
