import ReactCountryFlag from "react-country-flag";

// Primero define la función extractCountry
const extractCountry = (empresa: string | undefined): string | null => {
    if (!empresa) return null;

    // Expresión regular para encontrar el país entre paréntesis
    const match = empresa.match(/\(([^)]+)\)/);
    return match ? match[1].trim().toUpperCase() : null;
};

// Mapeo de países a códigos ISO
const countryCodes: Record<string, string> = {
    "COLOMBIA": "CO",
    "ARGENTINA": "AR",
    "URUGUAY": "UY",
    "CHILE": "CL",
    "BRASIL": "BR",
    "MÉXICO": "MX",
    "PERÚ": "PE",
    "ECUADOR": "EC",
    // Agrega más países según necesites
};

interface CountryFlagProps {
    empresa: string | undefined;
    size?: string;
}

export const CountryFlag = ({ empresa, size = "2em" }: CountryFlagProps) => {
    if (!empresa) return null;

    const country = extractCountry(empresa);

    if (!country) return null;

    const countryCode = countryCodes[country];

    if (!countryCode) {
        console.warn(`No se encontró código de país para: ${country}`);
        return null;
    }

    return (
        <ReactCountryFlag
            countryCode={countryCode}
            svg
            style={{
                width: size,
                height: size,
            }}
            title={country}
        />
    );
};

interface EmojiFlagProps {
    empresa: string | undefined;
}

export const EmojiFlag = ({ empresa }: EmojiFlagProps) => {
    if (!empresa) return null;

    const country = extractCountry(empresa);

    if (!country) return null;

    const flagEmojis: Record<string, string> = {
        "COLOMBIA": "🇨🇴",
        "ARGENTINA": "🇦🇷",
        "URUGUAY": "🇺🇾",
        "CHILE": "🇨🇱",
        "BRASIL": "🇧🇷",
        "MÉXICO": "🇲🇽",
        "PERÚ": "🇵🇪",
        "ECUADOR": "🇪🇨",
        // Agrega más países según necesites
    };

    const emoji = flagEmojis[country];

    return emoji ? (
        <span className="text-2xl" title={country}>
            {emoji}
        </span>
    ) : null;
};