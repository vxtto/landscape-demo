import type { ReactNode } from "react";

import styles from "./embed.module.css";

export default function EmbedLayout({ children }: { children: ReactNode }) {
  return <main className={styles.page}>{children}</main>;
}

