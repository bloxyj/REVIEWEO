<?php

declare(strict_types=1);

namespace Src\Core;

final class JwtService
{
    private string $secret;
    private string $issuer;
    private int $ttl;

    public function __construct()
    {
        $this->secret = (string) (getenv('JWT_SECRET') ?: 'revieweo-dev-secret-change-me');
        $this->issuer = (string) (getenv('JWT_ISSUER') ?: 'revieweo-api');
        $this->ttl = (int) (getenv('JWT_TTL') ?: 3600);
    }

    /**
     * @param array<string, mixed> $claims
     * @return array{token:string, expires_in:int, exp:int, jti:string}
     */
    public function generateToken(array $claims): array
    {
        $issuedAt = time();
        $expiresAt = $issuedAt + $this->ttl;
        $jti = bin2hex(random_bytes(16));

        $payload = array_merge($claims, [
            'iss' => $this->issuer,
            'iat' => $issuedAt,
            'exp' => $expiresAt,
            'jti' => $jti,
        ]);

        $header = ['alg' => 'HS256', 'typ' => 'JWT'];
        $token = $this->encode($header, $payload);

        return [
            'token' => $token,
            'expires_in' => $this->ttl,
            'exp' => $expiresAt,
            'jti' => $jti,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    public function decodeToken(string $token, bool $validateExpiry = true): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$encodedHeader, $encodedPayload, $encodedSignature] = $parts;

        $headerJson = $this->base64UrlDecode($encodedHeader);
        $payloadJson = $this->base64UrlDecode($encodedPayload);

        if ($headerJson === null || $payloadJson === null) {
            return null;
        }

        $header = json_decode($headerJson, true);
        $payload = json_decode($payloadJson, true);

        if (!is_array($header) || !is_array($payload)) {
            return null;
        }

        if (($header['alg'] ?? '') !== 'HS256') {
            return null;
        }

        $expectedSignature = $this->base64UrlEncode(
            hash_hmac('sha256', $encodedHeader . '.' . $encodedPayload, $this->secret, true)
        );

        if (!hash_equals($expectedSignature, $encodedSignature)) {
            return null;
        }

        if ($validateExpiry && isset($payload['exp']) && (int) $payload['exp'] < time()) {
            return null;
        }

        return $payload;
    }

    /**
     * @param array<string, mixed> $header
     * @param array<string, mixed> $payload
     */
    private function encode(array $header, array $payload): string
    {
        $encodedHeader = $this->base64UrlEncode((string) json_encode($header));
        $encodedPayload = $this->base64UrlEncode((string) json_encode($payload));
        $signature = hash_hmac('sha256', $encodedHeader . '.' . $encodedPayload, $this->secret, true);
        $encodedSignature = $this->base64UrlEncode($signature);

        return $encodedHeader . '.' . $encodedPayload . '.' . $encodedSignature;
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $value): ?string
    {
        $padding = strlen($value) % 4;
        if ($padding > 0) {
            $value .= str_repeat('=', 4 - $padding);
        }

        $decoded = base64_decode(strtr($value, '-_', '+/'), true);

        return $decoded === false ? null : $decoded;
    }
}
