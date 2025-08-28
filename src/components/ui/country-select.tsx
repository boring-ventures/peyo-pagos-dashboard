"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Country {
  code: string;
  name: string;
  nameEs: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { code: "AF", name: "Afghanistan", nameEs: "Afganistán", flag: "🇦🇫" },
  { code: "AL", name: "Albania", nameEs: "Albania", flag: "🇦🇱" },
  { code: "DZ", name: "Algeria", nameEs: "Argelia", flag: "🇩🇿" },
  { code: "AD", name: "Andorra", nameEs: "Andorra", flag: "🇦🇩" },
  { code: "AO", name: "Angola", nameEs: "Angola", flag: "🇦🇴" },
  { code: "AR", name: "Argentina", nameEs: "Argentina", flag: "🇦🇷" },
  { code: "AM", name: "Armenia", nameEs: "Armenia", flag: "🇦🇲" },
  { code: "AU", name: "Australia", nameEs: "Australia", flag: "🇦🇺" },
  { code: "AT", name: "Austria", nameEs: "Austria", flag: "🇦🇹" },
  { code: "AZ", name: "Azerbaijan", nameEs: "Azerbaiyán", flag: "🇦🇿" },
  { code: "BS", name: "Bahamas", nameEs: "Bahamas", flag: "🇧🇸" },
  { code: "BH", name: "Bahrain", nameEs: "Baréin", flag: "🇧🇭" },
  { code: "BD", name: "Bangladesh", nameEs: "Bangladesh", flag: "🇧🇩" },
  { code: "BB", name: "Barbados", nameEs: "Barbados", flag: "🇧🇧" },
  { code: "BY", name: "Belarus", nameEs: "Bielorrusia", flag: "🇧🇾" },
  { code: "BE", name: "Belgium", nameEs: "Bélgica", flag: "🇧🇪" },
  { code: "BZ", name: "Belize", nameEs: "Belice", flag: "🇧🇿" },
  { code: "BJ", name: "Benin", nameEs: "Benín", flag: "🇧🇯" },
  { code: "BT", name: "Bhutan", nameEs: "Bután", flag: "🇧🇹" },
  { code: "BO", name: "Bolivia", nameEs: "Bolivia", flag: "🇧🇴" },
  { code: "BA", name: "Bosnia and Herzegovina", nameEs: "Bosnia y Herzegovina", flag: "🇧🇦" },
  { code: "BW", name: "Botswana", nameEs: "Botsuana", flag: "🇧🇼" },
  { code: "BR", name: "Brazil", nameEs: "Brasil", flag: "🇧🇷" },
  { code: "BN", name: "Brunei", nameEs: "Brunéi", flag: "🇧🇳" },
  { code: "BG", name: "Bulgaria", nameEs: "Bulgaria", flag: "🇧🇬" },
  { code: "BF", name: "Burkina Faso", nameEs: "Burkina Faso", flag: "🇧🇫" },
  { code: "BI", name: "Burundi", nameEs: "Burundi", flag: "🇧🇮" },
  { code: "CV", name: "Cape Verde", nameEs: "Cabo Verde", flag: "🇨🇻" },
  { code: "KH", name: "Cambodia", nameEs: "Camboya", flag: "🇰🇭" },
  { code: "CM", name: "Cameroon", nameEs: "Camerún", flag: "🇨🇲" },
  { code: "CA", name: "Canada", nameEs: "Canadá", flag: "🇨🇦" },
  { code: "CF", name: "Central African Republic", nameEs: "República Centroafricana", flag: "🇨🇫" },
  { code: "TD", name: "Chad", nameEs: "Chad", flag: "🇹🇩" },
  { code: "CL", name: "Chile", nameEs: "Chile", flag: "🇨🇱" },
  { code: "CN", name: "China", nameEs: "China", flag: "🇨🇳" },
  { code: "CO", name: "Colombia", nameEs: "Colombia", flag: "🇨🇴" },
  { code: "KM", name: "Comoros", nameEs: "Comoras", flag: "🇰🇲" },
  { code: "CG", name: "Congo", nameEs: "Congo", flag: "🇨🇬" },
  { code: "CR", name: "Costa Rica", nameEs: "Costa Rica", flag: "🇨🇷" },
  { code: "CI", name: "Côte d'Ivoire", nameEs: "Costa de Marfil", flag: "🇨🇮" },
  { code: "HR", name: "Croatia", nameEs: "Croacia", flag: "🇭🇷" },
  { code: "CU", name: "Cuba", nameEs: "Cuba", flag: "🇨🇺" },
  { code: "CY", name: "Cyprus", nameEs: "Chipre", flag: "🇨🇾" },
  { code: "CZ", name: "Czech Republic", nameEs: "República Checa", flag: "🇨🇿" },
  { code: "DK", name: "Denmark", nameEs: "Dinamarca", flag: "🇩🇰" },
  { code: "DJ", name: "Djibouti", nameEs: "Yibuti", flag: "🇩🇯" },
  { code: "DM", name: "Dominica", nameEs: "Dominica", flag: "🇩🇲" },
  { code: "DO", name: "Dominican Republic", nameEs: "República Dominicana", flag: "🇩🇴" },
  { code: "EC", name: "Ecuador", nameEs: "Ecuador", flag: "🇪🇨" },
  { code: "EG", name: "Egypt", nameEs: "Egipto", flag: "🇪🇬" },
  { code: "SV", name: "El Salvador", nameEs: "El Salvador", flag: "🇸🇻" },
  { code: "GQ", name: "Equatorial Guinea", nameEs: "Guinea Ecuatorial", flag: "🇬🇶" },
  { code: "ER", name: "Eritrea", nameEs: "Eritrea", flag: "🇪🇷" },
  { code: "EE", name: "Estonia", nameEs: "Estonia", flag: "🇪🇪" },
  { code: "SZ", name: "Eswatini", nameEs: "Esuatini", flag: "🇸🇿" },
  { code: "ET", name: "Ethiopia", nameEs: "Etiopía", flag: "🇪🇹" },
  { code: "FJ", name: "Fiji", nameEs: "Fiyi", flag: "🇫🇯" },
  { code: "FI", name: "Finland", nameEs: "Finlandia", flag: "🇫🇮" },
  { code: "FR", name: "France", nameEs: "Francia", flag: "🇫🇷" },
  { code: "GA", name: "Gabon", nameEs: "Gabón", flag: "🇬🇦" },
  { code: "GM", name: "Gambia", nameEs: "Gambia", flag: "🇬🇲" },
  { code: "GE", name: "Georgia", nameEs: "Georgia", flag: "🇬🇪" },
  { code: "DE", name: "Germany", nameEs: "Alemania", flag: "🇩🇪" },
  { code: "GH", name: "Ghana", nameEs: "Ghana", flag: "🇬🇭" },
  { code: "GR", name: "Greece", nameEs: "Grecia", flag: "🇬🇷" },
  { code: "GD", name: "Grenada", nameEs: "Granada", flag: "🇬🇩" },
  { code: "GT", name: "Guatemala", nameEs: "Guatemala", flag: "🇬🇹" },
  { code: "GN", name: "Guinea", nameEs: "Guinea", flag: "🇬🇳" },
  { code: "GW", name: "Guinea-Bissau", nameEs: "Guinea-Bisáu", flag: "🇬🇼" },
  { code: "GY", name: "Guyana", nameEs: "Guyana", flag: "🇬🇾" },
  { code: "HT", name: "Haiti", nameEs: "Haití", flag: "🇭🇹" },
  { code: "HN", name: "Honduras", nameEs: "Honduras", flag: "🇭🇳" },
  { code: "HU", name: "Hungary", nameEs: "Hungría", flag: "🇭🇺" },
  { code: "IS", name: "Iceland", nameEs: "Islandia", flag: "🇮🇸" },
  { code: "IN", name: "India", nameEs: "India", flag: "🇮🇳" },
  { code: "ID", name: "Indonesia", nameEs: "Indonesia", flag: "🇮🇩" },
  { code: "IR", name: "Iran", nameEs: "Irán", flag: "🇮🇷" },
  { code: "IQ", name: "Iraq", nameEs: "Irak", flag: "🇮🇶" },
  { code: "IE", name: "Ireland", nameEs: "Irlanda", flag: "🇮🇪" },
  { code: "IL", name: "Israel", nameEs: "Israel", flag: "🇮🇱" },
  { code: "IT", name: "Italy", nameEs: "Italia", flag: "🇮🇹" },
  { code: "JM", name: "Jamaica", nameEs: "Jamaica", flag: "🇯🇲" },
  { code: "JP", name: "Japan", nameEs: "Japón", flag: "🇯🇵" },
  { code: "JO", name: "Jordan", nameEs: "Jordania", flag: "🇯🇴" },
  { code: "KZ", name: "Kazakhstan", nameEs: "Kazajistán", flag: "🇰🇿" },
  { code: "KE", name: "Kenya", nameEs: "Kenia", flag: "🇰🇪" },
  { code: "KI", name: "Kiribati", nameEs: "Kiribati", flag: "🇰🇮" },
  { code: "KW", name: "Kuwait", nameEs: "Kuwait", flag: "🇰🇼" },
  { code: "KG", name: "Kyrgyzstan", nameEs: "Kirguistán", flag: "🇰🇬" },
  { code: "LA", name: "Laos", nameEs: "Laos", flag: "🇱🇦" },
  { code: "LV", name: "Latvia", nameEs: "Letonia", flag: "🇱🇻" },
  { code: "LB", name: "Lebanon", nameEs: "Líbano", flag: "🇱🇧" },
  { code: "LS", name: "Lesotho", nameEs: "Lesoto", flag: "🇱🇸" },
  { code: "LR", name: "Liberia", nameEs: "Liberia", flag: "🇱🇷" },
  { code: "LY", name: "Libya", nameEs: "Libia", flag: "🇱🇾" },
  { code: "LI", name: "Liechtenstein", nameEs: "Liechtenstein", flag: "🇱🇮" },
  { code: "LT", name: "Lithuania", nameEs: "Lituania", flag: "🇱🇹" },
  { code: "LU", name: "Luxembourg", nameEs: "Luxemburgo", flag: "🇱🇺" },
  { code: "MG", name: "Madagascar", nameEs: "Madagascar", flag: "🇲🇬" },
  { code: "MW", name: "Malawi", nameEs: "Malaui", flag: "🇲🇼" },
  { code: "MY", name: "Malaysia", nameEs: "Malasia", flag: "🇲🇾" },
  { code: "MV", name: "Maldives", nameEs: "Maldivas", flag: "🇲🇻" },
  { code: "ML", name: "Mali", nameEs: "Malí", flag: "🇲🇱" },
  { code: "MT", name: "Malta", nameEs: "Malta", flag: "🇲🇹" },
  { code: "MH", name: "Marshall Islands", nameEs: "Islas Marshall", flag: "🇲🇭" },
  { code: "MR", name: "Mauritania", nameEs: "Mauritania", flag: "🇲🇷" },
  { code: "MU", name: "Mauritius", nameEs: "Mauricio", flag: "🇲🇺" },
  { code: "MX", name: "Mexico", nameEs: "México", flag: "🇲🇽" },
  { code: "FM", name: "Micronesia", nameEs: "Micronesia", flag: "🇫🇲" },
  { code: "MD", name: "Moldova", nameEs: "Moldavia", flag: "🇲🇩" },
  { code: "MC", name: "Monaco", nameEs: "Mónaco", flag: "🇲🇨" },
  { code: "MN", name: "Mongolia", nameEs: "Mongolia", flag: "🇲🇳" },
  { code: "ME", name: "Montenegro", nameEs: "Montenegro", flag: "🇲🇪" },
  { code: "MA", name: "Morocco", nameEs: "Marruecos", flag: "🇲🇦" },
  { code: "MZ", name: "Mozambique", nameEs: "Mozambique", flag: "🇲🇿" },
  { code: "MM", name: "Myanmar", nameEs: "Myanmar", flag: "🇲🇲" },
  { code: "NA", name: "Namibia", nameEs: "Namibia", flag: "🇳🇦" },
  { code: "NR", name: "Nauru", nameEs: "Nauru", flag: "🇳🇷" },
  { code: "NP", name: "Nepal", nameEs: "Nepal", flag: "🇳🇵" },
  { code: "NL", name: "Netherlands", nameEs: "Países Bajos", flag: "🇳🇱" },
  { code: "NZ", name: "New Zealand", nameEs: "Nueva Zelanda", flag: "🇳🇿" },
  { code: "NI", name: "Nicaragua", nameEs: "Nicaragua", flag: "🇳🇮" },
  { code: "NE", name: "Niger", nameEs: "Níger", flag: "🇳🇪" },
  { code: "NG", name: "Nigeria", nameEs: "Nigeria", flag: "🇳🇬" },
  { code: "KP", name: "North Korea", nameEs: "Corea del Norte", flag: "🇰🇵" },
  { code: "MK", name: "North Macedonia", nameEs: "Macedonia del Norte", flag: "🇲🇰" },
  { code: "NO", name: "Norway", nameEs: "Noruega", flag: "🇳🇴" },
  { code: "OM", name: "Oman", nameEs: "Omán", flag: "🇴🇲" },
  { code: "PK", name: "Pakistan", nameEs: "Pakistán", flag: "🇵🇰" },
  { code: "PW", name: "Palau", nameEs: "Palaos", flag: "🇵🇼" },
  { code: "PS", name: "Palestine", nameEs: "Palestina", flag: "🇵🇸" },
  { code: "PA", name: "Panama", nameEs: "Panamá", flag: "🇵🇦" },
  { code: "PG", name: "Papua New Guinea", nameEs: "Papúa Nueva Guinea", flag: "🇵🇬" },
  { code: "PY", name: "Paraguay", nameEs: "Paraguay", flag: "🇵🇾" },
  { code: "PE", name: "Peru", nameEs: "Perú", flag: "🇵🇪" },
  { code: "PH", name: "Philippines", nameEs: "Filipinas", flag: "🇵🇭" },
  { code: "PL", name: "Poland", nameEs: "Polonia", flag: "🇵🇱" },
  { code: "PT", name: "Portugal", nameEs: "Portugal", flag: "🇵🇹" },
  { code: "QA", name: "Qatar", nameEs: "Catar", flag: "🇶🇦" },
  { code: "RO", name: "Romania", nameEs: "Rumania", flag: "🇷🇴" },
  { code: "RU", name: "Russia", nameEs: "Rusia", flag: "🇷🇺" },
  { code: "RW", name: "Rwanda", nameEs: "Ruanda", flag: "🇷🇼" },
  { code: "KN", name: "Saint Kitts and Nevis", nameEs: "San Cristóbal y Nieves", flag: "🇰🇳" },
  { code: "LC", name: "Saint Lucia", nameEs: "Santa Lucía", flag: "🇱🇨" },
  { code: "VC", name: "Saint Vincent and the Grenadines", nameEs: "San Vicente y las Granadinas", flag: "🇻🇨" },
  { code: "WS", name: "Samoa", nameEs: "Samoa", flag: "🇼🇸" },
  { code: "SM", name: "San Marino", nameEs: "San Marino", flag: "🇸🇲" },
  { code: "ST", name: "São Tomé and Príncipe", nameEs: "Santo Tomé y Príncipe", flag: "🇸🇹" },
  { code: "SA", name: "Saudi Arabia", nameEs: "Arabia Saudita", flag: "🇸🇦" },
  { code: "SN", name: "Senegal", nameEs: "Senegal", flag: "🇸🇳" },
  { code: "RS", name: "Serbia", nameEs: "Serbia", flag: "🇷🇸" },
  { code: "SC", name: "Seychelles", nameEs: "Seychelles", flag: "🇸🇨" },
  { code: "SL", name: "Sierra Leone", nameEs: "Sierra Leona", flag: "🇸🇱" },
  { code: "SG", name: "Singapore", nameEs: "Singapur", flag: "🇸🇬" },
  { code: "SK", name: "Slovakia", nameEs: "Eslovaquia", flag: "🇸🇰" },
  { code: "SI", name: "Slovenia", nameEs: "Eslovenia", flag: "🇸🇮" },
  { code: "SB", name: "Solomon Islands", nameEs: "Islas Salomón", flag: "🇸🇧" },
  { code: "SO", name: "Somalia", nameEs: "Somalia", flag: "🇸🇴" },
  { code: "ZA", name: "South Africa", nameEs: "Sudáfrica", flag: "🇿🇦" },
  { code: "KR", name: "South Korea", nameEs: "Corea del Sur", flag: "🇰🇷" },
  { code: "SS", name: "South Sudan", nameEs: "Sudán del Sur", flag: "🇸🇸" },
  { code: "ES", name: "Spain", nameEs: "España", flag: "🇪🇸" },
  { code: "LK", name: "Sri Lanka", nameEs: "Sri Lanka", flag: "🇱🇰" },
  { code: "SD", name: "Sudan", nameEs: "Sudán", flag: "🇸🇩" },
  { code: "SR", name: "Suriname", nameEs: "Surinam", flag: "🇸🇷" },
  { code: "SE", name: "Sweden", nameEs: "Suecia", flag: "🇸🇪" },
  { code: "CH", name: "Switzerland", nameEs: "Suiza", flag: "🇨🇭" },
  { code: "SY", name: "Syria", nameEs: "Siria", flag: "🇸🇾" },
  { code: "TW", name: "Taiwan", nameEs: "Taiwán", flag: "🇹🇼" },
  { code: "TJ", name: "Tajikistan", nameEs: "Tayikistán", flag: "🇹🇯" },
  { code: "TZ", name: "Tanzania", nameEs: "Tanzania", flag: "🇹🇿" },
  { code: "TH", name: "Thailand", nameEs: "Tailandia", flag: "🇹🇭" },
  { code: "TL", name: "Timor-Leste", nameEs: "Timor Oriental", flag: "🇹🇱" },
  { code: "TG", name: "Togo", nameEs: "Togo", flag: "🇹🇬" },
  { code: "TO", name: "Tonga", nameEs: "Tonga", flag: "🇹🇴" },
  { code: "TT", name: "Trinidad and Tobago", nameEs: "Trinidad y Tobago", flag: "🇹🇹" },
  { code: "TN", name: "Tunisia", nameEs: "Túnez", flag: "🇹🇳" },
  { code: "TR", name: "Turkey", nameEs: "Turquía", flag: "🇹🇷" },
  { code: "TM", name: "Turkmenistan", nameEs: "Turkmenistán", flag: "🇹🇲" },
  { code: "TV", name: "Tuvalu", nameEs: "Tuvalu", flag: "🇹🇻" },
  { code: "UG", name: "Uganda", nameEs: "Uganda", flag: "🇺🇬" },
  { code: "UA", name: "Ukraine", nameEs: "Ucrania", flag: "🇺🇦" },
  { code: "AE", name: "United Arab Emirates", nameEs: "Emiratos Árabes Unidos", flag: "🇦🇪" },
  { code: "GB", name: "United Kingdom", nameEs: "Reino Unido", flag: "🇬🇧" },
  { code: "US", name: "United States", nameEs: "Estados Unidos", flag: "🇺🇸" },
  { code: "UY", name: "Uruguay", nameEs: "Uruguay", flag: "🇺🇾" },
  { code: "UZ", name: "Uzbekistan", nameEs: "Uzbekistán", flag: "🇺🇿" },
  { code: "VU", name: "Vanuatu", nameEs: "Vanuatu", flag: "🇻🇺" },
  { code: "VA", name: "Vatican City", nameEs: "Ciudad del Vaticano", flag: "🇻🇦" },
  { code: "VE", name: "Venezuela", nameEs: "Venezuela", flag: "🇻🇪" },
  { code: "VN", name: "Vietnam", nameEs: "Vietnam", flag: "🇻🇳" },
  { code: "YE", name: "Yemen", nameEs: "Yemen", flag: "🇾🇪" },
  { code: "ZM", name: "Zambia", nameEs: "Zambia", flag: "🇿🇲" },
  { code: "ZW", name: "Zimbabwe", nameEs: "Zimbabue", flag: "🇿🇼" },
];

interface CountrySelectProps {
  value?: string;
  onChange?: (countryCode: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const CountrySelect = React.forwardRef<HTMLInputElement, CountrySelectProps>(
  ({ 
    value, 
    onChange, 
    placeholder = "Buscar país...", 
    className,
    disabled = false
  }, _ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");

    const selectedCountry = COUNTRIES.find(country => country.code === value);

    const filteredCountries = React.useMemo(() => {
      if (!searchTerm) return COUNTRIES;
      
      const term = searchTerm.toLowerCase();
      return COUNTRIES.filter(country =>
        country.nameEs.toLowerCase().includes(term) ||
        country.name.toLowerCase().includes(term)
      );
    }, [searchTerm]);

    const handleSelect = (country: Country) => {
      onChange?.(country.code);
      setIsOpen(false);
      setSearchTerm("");
    };

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedCountry && "text-muted-foreground",
              className
            )}
            disabled={disabled}
          >
            {selectedCountry ? (
              <div className="flex items-center gap-2">
                <span>{selectedCountry.flag}</span>
                <span>{selectedCountry.nameEs}</span>
              </div>
            ) : (
              placeholder
            )}
            <ChevronDown className="ml-auto h-4 w-4" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-[300px] p-0" align="start">
          <div className="p-3">
            {/* Search input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar país..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Countries list */}
            <div className="max-h-[200px] overflow-y-auto">
              {filteredCountries.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  No se encontraron países
                </div>
              ) : (
                filteredCountries.map((country) => (
                  <Button
                    key={country.code}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-left h-auto p-2 hover:bg-accent",
                      value === country.code && "bg-accent"
                    )}
                    onClick={() => handleSelect(country)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{country.flag}</span>
                      <div>
                        <div className="font-medium">{country.nameEs}</div>
                        {country.nameEs !== country.name && (
                          <div className="text-xs text-muted-foreground">{country.name}</div>
                        )}
                      </div>
                      {value === country.code && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
                    </div>
                  </Button>
                ))
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);

CountrySelect.displayName = "CountrySelect";

export { COUNTRIES };
export type { Country };