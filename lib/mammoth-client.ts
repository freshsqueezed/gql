export interface HttpLinkOptions {
  uri: string;
}

export class HttpLink {
  options: HttpLinkOptions;

  constructor(options: HttpLinkOptions) {
    this.options = options;
  }
}

export interface MammothClientOptions {
  link: HttpLink;
}

export class MammothClient {
  link: HttpLink;

  constructor({ link }: MammothClientOptions) {
    this.link = link;
  }

  request() {
    console.log('api link', this.link.options.uri);
  }
}
