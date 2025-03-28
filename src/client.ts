import querystring from "querystring";

export type SMAResponse = {
  err: number;
} & {
  result: any;
};

export function isSMAResponse(response: unknown): response is SMAResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    (("err" in response && typeof (response as SMAResponse).err === "number") ||
      "result" in response)
  );
}
export async function createClient(host: string, role = "", password = ""): Promise<Client> {
  const client = new Client(host, role, password);
  await client.init();
  return client;
}

export class Client {
  public port = 80;
  public protocol = "http";
  public metadata: Record<string, any> = {};
  public codes: Record<string, any> = {};
  public sessionID: string = "";

  constructor(public host: string, public role = "usr", public password = "") {}

  init(): Promise<any> {
    return Promise.all([
      this._get("/data/ObjectMetadata_Istl.json").then((result) => {
        this.metadata = result;
      }),
      this._get("/data/l10n/en-US.json").then((result) => {
        this.codes = result;
      }),
    ]);
  }

  async _get(
    path: string,
    query?: querystring.ParsedUrlQueryInput | undefined
  ): Promise<SMAResponse> {
    return fetch(
      `${this.protocol}://${this.host}:${this.port}/${path.replace(
        /^\//,
        ""
      )}?${querystring.stringify(query)}`,
      {
        method: "GET",
      }
    )
      .then((r) => r.json())
      .then((response: any) => {
        if (response.err) {
          throw response;
        }
        return response;
      });
  }

  async _post(
    path: string,
    query?: querystring.ParsedUrlQueryInput | undefined,
    data?: object
  ): Promise<SMAResponse> {
    return fetch(
      `${this.protocol}://${this.host}:${this.port}/${path.replace(
        /^\//,
        ""
      )}?${querystring.stringify(query)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    )
      .then((r) => r.json())
      .then((response: any) => {
        if (response.err) {
          throw response;
        }
        return response;
      });
  }

  async _postWithSession(
    path: string,
    query: querystring.ParsedUrlQueryInput | undefined,
    data: object
  ): Promise<SMAResponse> {
    if (!this.sessionID) {
      await this.login(this.password, this.role);
      query = { ...query, sid: this.sessionID };
    }

    return this._post(path, query, data).catch((response: SMAResponse) => {
      if (!response.err) {
        return response;
      }

      if (response.err == 401 && this.password) {
        return this.login(this.password, this.role).then(() => {
          query = { ...query, sid: this.sessionID };
          return this._post(path, query, data);
        });
      }

      throw response;
    });
  }

  async login(password: string, role: string = "usr"): Promise<Record<string, any>> {
    return this._post("/dyn/login.json", undefined, {
      right: role || "usr",
      pass: password,
    }).then((response: SMAResponse) => {
      if (!response?.result?.sid) {
        throw response;
      }
      this.sessionID = response.result.sid;
      return response?.result;
    });
  }

  async getAllOnlValues(devices: string[] = []): Promise<Record<string, any>> {
    return this._postWithSession(
      `/dyn/getAllOnlValues.json`,
      { sid: this.sessionID },
      {
        destDev: devices || [],
      }
    ).then((response: SMAResponse) => {
      if (!response?.result) {
        throw response;
      }
      return response?.result;
    });
  }
}
