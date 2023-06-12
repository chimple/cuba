import { autocomplete } from "@algolia/autocomplete-js";
import { createElement, Fragment, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";

export function Autocomplete(props) {
  // const containerRef = useRef(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const panelRootRef = useRef<any>(null);
  const rootRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const search = autocomplete({
      container: containerRef.current,
      renderer: { createElement, Fragment, render: () => {} },
      render({ children }, root) {
        if (!panelRootRef.current || rootRef.current !== root) {
          rootRef.current = root;

          panelRootRef.current?.unmount();
          panelRootRef.current = createRoot(root);
        }

        panelRootRef.current.render(children);
      },
      ...props,
    });

    const inputElement = containerRef.current.querySelector("input");
if (!inputElement || inputElement.value === "") {
  inputElement?.focus();
}

    return () => {
      search.destroy();
    };
  }, [props]);

  return(
    <div className="auto-complete" ref={containerRef}>
     {/* <style>{`
        .auto-complete {
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid black;
          padding: none;
          width: 35%;
        }

        .auto-complete.focused {
          box-shadow: 0 0 0 3px blue;
        }

        .auto-complete input {
          width: 100%;
          height:100%;
          border: none;
          outline: none;
          padding: 8px;
          box-sizing: border-box;
        }
      `}</style> */}
    </div>
  );
}