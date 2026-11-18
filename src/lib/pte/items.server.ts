import "server-only";
import type { PteItem } from "./scoring";
import rw_fib from "@/data/pte/rw_fib.json";
import r_mcma from "@/data/pte/r_mcma.json";
import r_reorder from "@/data/pte/r_reorder.json";
import r_fib from "@/data/pte/r_fib.json";
import r_mcsa from "@/data/pte/r_mcsa.json";
import l_mcma from "@/data/pte/l_mcma.json";
import l_fib from "@/data/pte/l_fib.json";
import l_hcs from "@/data/pte/l_hcs.json";
import l_mcsa from "@/data/pte/l_mcsa.json";
import l_smw from "@/data/pte/l_smw.json";
import l_hiw from "@/data/pte/l_hiw.json";
import l_wfd from "@/data/pte/l_wfd.json";

// Answer keys live only here, on the server; students get publicItem() copies.
export const PTE_ITEMS = [
  ...rw_fib, ...r_mcma, ...r_reorder, ...r_fib, ...r_mcsa,
  ...l_mcma, ...l_fib, ...l_hcs, ...l_mcsa, ...l_smw, ...l_hiw, ...l_wfd,
] as PteItem[];

const byId = new Map(PTE_ITEMS.map((i) => [i.id, i]));
export const getPteItem = (id: string) => byId.get(id);
