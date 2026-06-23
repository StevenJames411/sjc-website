"use client";
import { createContext, useContext } from "react";

// Lightweight context every section reads through <Editable>. Public visitors get the
// inert default (editing:false, getText returns the fallback) so sections render their
// committed copy with zero edit behavior. The editor (SitePage) supplies the live
// override map + setters when Steven is in edit mode.
export type EditTextCtx = {
  editing: boolean;
  getText: (tid: string, fallback: string) => string;
  setText: (tid: string, value: string) => void;
};

export const EditTextContext = createContext<EditTextCtx>({
  editing: false,
  getText: (_tid, fallback) => fallback,
  setText: () => {},
});

export const useEditText = () => useContext(EditTextContext);
