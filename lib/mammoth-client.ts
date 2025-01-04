export interface HttpLinkOptions {
  link: string;
}

export class HttpLink {
  options: HttpLinkOptions;

  constructor(options: HttpLinkOptions) {
    this.options = options;
    console.log({ options: this.options });
  }
}

export class MammothClient {
  constructor() {}
}
