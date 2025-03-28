# sma-solar

An HTTP client for the SMA Solar Inverters Webconnect Portal.

## Usage

```sh
npx sma-solar -h='192.168.1.2' -p='password'

> 2025-03-28 14:56:07  Current power: 161 W
> 2025-03-28 14:56:12  Current power: 160 W
> 2025-03-28 14:56:17  Current power: 158 W
```

## Wishlist

- [ ] Define all SMA constants and types.
- [ ] Add commands to retrieve different metrics.
- [ ] Add arugments to control session and polling frequency.
- [ ] Output metrics in a time series database.
- [ ] Dev-friendly library API.
- [ ] Tests.

## License

See LICENSE.
