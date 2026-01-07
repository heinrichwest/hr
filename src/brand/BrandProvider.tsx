import { createContext, useContext, type PropsWithChildren } from "react";
import { speccon, type SpecconTokens } from "./tokens";
import "./global.css";

const BrandContext = createContext<SpecconTokens>(speccon);

export function BrandProvider({ children }: PropsWithChildren) {
    return <BrandContext.Provider value={speccon}>{children}</BrandContext.Provider>;
}

export function useBrand() {
    return useContext(BrandContext);
}
