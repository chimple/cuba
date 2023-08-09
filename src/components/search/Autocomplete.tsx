import { autocomplete } from "@algolia/autocomplete-js";
import { createElement, Fragment, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./Autocomplete.css";

export function Autocomplete(props) {
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
    if (!!inputElement && inputElement.value === "") {
      setTimeout(() => {
        inputElement.focus();
      }, 500);
    }

    return () => {
      search.destroy();
    };
  }, [props]);

  return <div className="auto-complete" ref={containerRef}></div>;
}
