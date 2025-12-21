declare module "simply-beautiful" {
  interface PrettifyOptions {
    indent_size?: number;
    indent_char?: string;
    wrap_line_length?: number;
    end_with_newline?: boolean;
    [key: string]: any;
  }

  export function prettify(input: string, options?: PrettifyOptions): string;
}