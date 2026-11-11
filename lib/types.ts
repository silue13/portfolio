export type Project = {
  id: string;
  title: string;
  category: "data" | "web";
  summary: string;
  tech: string[];
  demo_url: string | null;
  logo_src: string | null;
};

export type Item = {
  id: string;
  kind: string;
  title: string;
  school: string;
  start_year: number | null;
  end_year: number | null;
  description: string | null;
};

export type ContactState = { ok: boolean; error?: string };
