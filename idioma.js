// Idioma de toda la pagina. La web se escribe en español; en ingles se traduce lo que se pinta.
// En las claves, "#" es cualquier numero: se copia en el mismo orden a la traduccion.
'use strict';
const IDIOMA = (() => { try { return JSON.parse(localStorage.getItem('radar-idioma')) === 'en' ? 'en' : 'es'; } catch { return 'es'; } })();
const EN = IDIOMA === 'en';
const LOC = EN ? 'en-US' : 'es-ES';

const DICCIONARIO = `
Inicio|Home
Mercado|Market
Cartera|Portfolio
Nosotros|Us
Actualizado ahora|Updated just now
Actualizado hace # min|Updated # min ago
Actualizado hace # h|Updated # h ago
Cargando…|Loading…
Sin datos todavía|No data yet
Modo prueba: alarmas y chat se guardan solo en este navegador hasta conectar la base compartida.|Test mode: alarms and chat are saved only in this browser until the shared database is connected.
Para ver las alarmas compartidas, el chat y recibir avisos, entra con tu clave.|To see shared alarms, the chat and get alerts, sign in with your key.
Entrar|Sign in
Secciones|Sections
Busca una empresa: Nvidia, COIN, Amazon…|Search a company: Nvidia, COIN, Amazon…
No la encuentro (bolsa de EE. UU. y las principales criptos).|Not found (US stocks and main cryptos).
Hoy manda|Today's mover
Vuestro radar de mercado|Your market radar
# alarma activa|# active alarm
# alarmas activas|# active alarms
Tu cartera|Your portfolio
Nasdaq (futuro)|Nasdaq (futures)
S&P # (futuro)|S&P # (futures)
Índice del miedo|Fear index
Oro|Gold
Petróleo|Oil
Crudo|Crude
Dólar|Dollar
Interés a # años|#-year yield
Todas las empresas|All companies
Mis favoritas|My favourites
★ Mis favoritas|★ My favourites
★ Elegir mis favoritas|★ Pick my favourites
Las # que más se mueven de #.|The # biggest movers out of #.
Miedo en el mercado|Market fear
Ver detalle|See details
Miedo extremo|Extreme fear
Miedo|Fear
Neutral|Neutral
Codicia|Greed
Codicia extrema|Extreme greed
miedo extremo|extreme fear
miedo|fear
neutral|neutral
codicia|greed
codicia extrema|extreme greed
Bolsa|Stocks
Bolsa de EE. UU.|US stocks
Bolsa de EE. UU. · CNN|US stocks · CNN
Ayer|Yesterday
Semana|Week
Mes|Month
Año|Year
Cripto|Crypto
Próximos resultados|Upcoming earnings
Calendario|Calendar
Sin datos todavía.|No data yet.
Se espera # · antes #|Expected # · prior #
Se espera #|Expected #
Sin previsión|No forecast
Sin previsión · antes #|No forecast · prior #
Alarmas más cerca|Closest alarms
sube a|rises to
baja a|falls to
ahora #|now #
falta un # · Yo|# to go · Me
Últimos avisos|Latest alerts
Aquí salen las alarmas que salten y las noticias de lo que sigáis.|Triggered alarms and news on what you follow show up here.
Entrad en una empresa y poned la primera.|Open a company and set the first one.
Una a una|One by one
Empresa|Company
Precio|Price
Hoy|Today
Tendencia|Trend
Ver todas las empresas (#)|See all companies (#)
Nuestras|Ours
Se mueven|Movers
Agenda|Calendar
Nuestras empresas|Our companies
o más|or more
Avisos del 10%|10% alerts
Con la bolsa|While the market is
cerrada|closed
Lo que se mueve antes de abrir y después del cierre.|What moves before the open and after the close.
Cómo reaccionó a sus resultados|How it reacted to earnings
se mueve de media|average move
veces subió|times up
veces bajó|times down
Superó|Beat
Falló|Missed
Fuera de horario|Extended hours
Nada en esta franja todavía.|Nothing in this session yet.
Aparece en la próxima actualización.|Appears on the next update.
Calculadora|Calculator
Acciones|Shares
Opciones|Options
Cuánto arriesgas ($)|Amount at risk ($)
Entrada|Entry
Stop (si sale mal)|Stop (if it goes wrong)
Objetivo|Target
Put (ganas si baja)|Put (profits if it drops)
Call (ganas si sube)|Call (profits if it rises)
Precio de ejercicio|Strike price
Prima por acción|Premium per share
Contratos (# acciones)|Contracts (# shares)
Precio que esperas al vencer|Expected price at expiry
Solo son cuentas con tus números. No es un consejo.|Just arithmetic on your numbers. Not advice.
Pon cuánto arriesgas, la entrada y el stop.|Enter risk, entry and stop.
Con ese riesgo no llega ni para una acción.|That risk is not enough for one share.
Compras (acciones)|Shares to buy
Inviertes|You invest
Posición en corto|Short position
Si salta el stop|If stopped out
Si llega al objetivo|If target hits
Ganas por cada $ arriesgado|Reward per $ risked
Pon el precio de ejercicio, la prima y los contratos.|Enter strike, premium and contracts.
Pagas|You pay
Lo máximo que pierdes|Maximum loss
Empatas si acaba en|Break-even at
Resultado al vencer|Result at expiry
Sobre lo pagado|On amount paid
Comparar|Compare
Hasta cuatro en el mismo gráfico, en porcentaje.|Up to four on one chart, in percent.
Añade una empresa|Add a company
Añadir empresa…|Add company…
Elige dos empresas para compararlas.|Pick two companies to compare.
Reaccionar|React
Alertas a tu gusto|Custom alerts
una empresa grande|a large company
una mediana o grande|a mid or large company
una de mis favoritas|one of my favourites
una de mi cartera|one from my portfolio
una del sector|one in the sector
Avísame si|Alert me if
cae|drops
sube|rises
un|by
% o más|% or more
Crear|Create
Se revisan mientras el mercado de EE. UU. está abierto y justo después. Como mucho # empresas al día por alerta.|Checked while the US market is open and just after. At most # companies per alert per day.
Alerta creada|Alert created
Alerta quitada|Alert removed
Instalar en el móvil|Install on phone
Radar en tu móvil|Radar on your phone
Instalar ahora|Install now
En tu iPhone, con Safari|On iPhone, with Safari
En Android, con Chrome|On Android, with Chrome
Toca Compartir|Tap Share
Añadir a pantalla de inicio|Add to Home Screen
Toca Añadir|Tap Add
Abre el menú de Chrome|Open the Chrome menu
Instalar aplicación|Install app
Toca Instalar|Tap Install
Abre esta página en el móvil y sigue estos pasos. Queda como una app, con su icono.|Open this page on your phone and follow these steps. It becomes an app with its own icon.
Reacción a resultados|Earnings reaction
Gráficos en el chat|Charts in chat
En tu móvil|On your phone
Novedades|What's new
Noviembre 2026|November 2026
Cinco formas de verlo|Five ways to view
Panel de inicio|Home dashboard
Cuentas en directo|Live accounts
Perfil con niveles|Profile with levels
Portadas de lujo|Luxury covers
Avisos del #%|#% alerts
Velas #H · #D · #W · #M|#H · #D · #W · #M candles
Hoy · Semana · Mes|Today · Week · Month
El Centinela|The Sentinel
Pista al atardecer|Runway at sunset
Aterrizaje de noche|Night landing
Ala al sol|Wing in the sun
Nubes de oro|Golden clouds
Estela al atardecer|Wake at sunset
Lancha en el lago|Boat on the lake
Alta mar|Open sea
Audi R8 al atardecer|Audi R8 at sunset
Ferrari al sol|Ferrari in the sun
Huracán en la sombra|Huracán in the shade
Mercedes en negro|Mercedes in black
Aston bajo el puente|Aston under the bridge
Aston descapotable|Aston convertible
Chiron de noche|Chiron at night
Aventador en el bosque|Aventador in the forest
Huracán amarillo|Yellow Huracán
Mustang clásico|Classic Mustang
La colección|The collection
La colección de relojes|Watch collection
Reloj frente al mar|Watch by the sea
Brindis|Cheers
Suite con vistas|Suite with a view
Suite clásica|Classic suite
Terraza al amanecer|Terrace at dawn
Maldivas|Maldives
Villas sobre el mar|Overwater villas
Mansión de noche|Mansion at night
Villa en la colina|Hillside villa
Casa de autor|Designer house
Villa con piscina|Pool villa
Casa blanca|White house
Atardecer en la piscina|Poolside sunset
Palmeras y agua|Palms and water
Jets y yates|Jets & yachts
Supercoches|Supercars
Vida de lujo|Luxury life
Mansiones|Mansions
Mis imágenes|My images
Copiad una imagen de Pinterest o de donde queráis y pegadla aquí con Ctrl+V. Se queda guardada.|Copy an image from Pinterest or anywhere and paste it here with Ctrl+V. It stays saved.
Jet al atardecer|Jet at sunset
Jet de noche|Jet at night
Sobre las nubes|Above the clouds
Cielo rosa|Pink sky
Desde la ventanilla|Window seat
Sala de embarque|Departure lounge
Megayate|Megayacht
Yate en alta mar|Yacht at sea
Puerto deportivo|Marina
Velero|Sailboat
Mónaco|Monaco
Bugatti blanco|White Bugatti
Chiron de frente|Chiron head on
Rolls en Dubái|Rolls in Dubai
Ferrari amarillo|Yellow Ferrari
Aventador azul|Blue Aventador
Aventador naranja|Orange Aventador
Huracán blanco|White Huracán
Huracán en ruta|Huracán on the road
Huracán naranja|Orange Huracán
AMG rojo|Red AMG
AMG amarillo|Yellow AMG
Clase G|G-Class
El garaje|The garage
Carretera al sol|Sunny road
Billetes de cien|Hundred bills
Lluvia de dólares|Dollar rain
Reloj oscuro|Dark watch
Cóctel|Cocktail
Copa|Glass
Suite en la montaña|Mountain suite
Piscina de noche|Pool at night
Piscina infinita|Infinity pool
Resort tropical|Tropical resort
Mansión blanca|White mansion
Casa con piscina|House with pool
Villa blanca|White villa
Salón|Living room
Pantalla|Display
Zoom de las portadas y transiciones|Cover zoom and transitions
La imagen grande de cada apartado|The big image on each section
Ver mi dinero|Show my money
Si lo apagas, la cartera sale tapada|Turn off to mask the portfolio
A un precio|At a price
Si se mueve un %|On a % move
Avísame si se mueve un|Alert me on a move of
Arriba o abajo|Up or down
Solo si baja|Only if it drops
Solo si sube|Only if it rises
Contando desde (tu precio de entrada)|Counting from (your entry price)
Además, si en un día se mueve un #% o más os avisa solo, sin poner nada.|Also, a #% or bigger daily move alerts you automatically.
Con ese porcentaje y esa entrada no queda nada por avisar.|With that % and entry there is nothing left to alert.
Este mes|This month
Cuánto han variado en los últimos # días|Change over the last # days
Cuánto han variado en el último mes|Change over the last month
Cuánto varían hoy|Change today
Cargando velas…|Loading candles…
Las velas de este plazo aparecen en la próxima actualización.|Candles for this timeframe appear on the next update.
Japón y neón|Japan & neon
Espacio|Space
Cuadros|Paintings
Coches|Cars
Ciudades|Cities
Naturaleza|Nature
Lujo|Luxury
Mercados|Markets
Abstracto|Abstract
Tokio de neón|Neon Tokyo
Carteles de Shinjuku|Shinjuku signs
Cruce en Tokio|Tokyo crossing
Farolillos|Lanterns
Callejón|Alley
Kioto|Kyoto
Torii en el lago|Torii on the lake
Torre de Tokio|Tokyo Tower
Monte Fuji|Mount Fuji
Acantilados cósmicos (Webb)|Cosmic Cliffs (Webb)
Pilares de la creación (Webb)|Pillars of Creation (Webb)
Vía Láctea|Milky Way
Centro de la galaxia|Galaxy core
Cielo violeta|Violet sky
Polvo de estrellas|Stardust
Observador|Stargazer
Luces desde el espacio|Lights from space
La gran ola · Hokusai|The Great Wave · Hokusai
Fuji rojo · Hokusai|Red Fuji · Hokusai
La noche estrellada · Van Gogh|The Starry Night · Van Gogh
Trigal con cuervos · Van Gogh|Wheatfield with Crows · Van Gogh
Sol naciente · Monet|Impression, Sunrise · Monet
El caminante · Friedrich|Wanderer · Friedrich
El Temerario · Turner|The Fighting Temeraire · Turner
Tormenta en el mar · Rembrandt|Storm on the Sea · Rembrandt
Torre de Babel · Bruegel|Tower of Babel · Bruegel
Domingo en el parque · Seurat|Sunday on La Grande Jatte · Seurat
911 en la nieve|911 in the snow
Mustang al sol|Mustang in the sun
Nueva York al atardecer|New York at sunset
Dubái|Dubai
Singapur|Singapore
París|Paris
Aurora boreal|Northern lights
Aurora sobre el bosque|Aurora over the forest
Valle nevado|Snowy valley
Bosque|Forest
Sierras en la niebla|Misty ridges
Oleaje desde arriba|Surf from above
Cascada|Waterfall
Yate|Yacht
Jet privado|Private jet
Reloj clásico|Classic watch
Cronógrafo|Chronograph
Casa moderna|Modern house
Criptomonedas|Cryptocurrencies
Lingotes|Gold bars
La bolsa en la mano|Markets in hand
Seda azul|Blue silk
Rosa eléctrico|Electric pink
Violeta|Violet
sector|sector
Sobre mí|About me
Quién es|About
Estilo|Style
Su meta|Goal
Invierte desde|Investing since
Desde|From
Riesgo|Risk
Largo plazo|Long term
Dividendos|Dividends
Un poco de todo|A bit of everything
Muy tranquilo|Very calm
Tranquilo|Calm
Equilibrado|Balanced
Atrevido|Bold
A por todas|All in
Cuenta quién eres: tu estilo, tu meta y cuánto te arriesgas.|Tell who you are: your style, goal and risk.
Aún no ha escrito nada.|Nothing written yet.
Rellenar|Fill in
Editar|Edit
Puntería|Accuracy
Sin ideas todavía. Cada idea dibujada cuenta aquí.|No ideas yet. Every drawn idea counts here.
Ver ideas|See ideas
Ganando|Winning
Perdiendo|Losing
Objetivos cumplidos|Targets hit
Seguridad media|Average confidence
Su mejor idea|Best idea
La que peor va|Worst idea
Apunta lo que tienes y verás el reparto.|Add what you own to see the split.
No ha apuntado ninguna inversión.|No investments added.
Ganancia total|Total gain
Ver todo|See all
En qué se fija|What they watch
Al marcar favoritas o seguir empresas aparecen sus sectores.|Add favourites or follow companies to see sectors.
Cara a cara|Head to head
Gráfico de TradingView|TradingView chart
Ventas desbloqueadas|Share unlocks
Cuándo pueden vender los de dentro|When insiders can sell
Ventas desbloqueadas: próximos 3 meses|Share unlocks: next 3 months
Empleados|Employees
Inversores|Investors
Directivos|Executives
Según prensa|Press
Calculado|Estimated
Oficial|Official
Fuente|Source
Fin de los bloqueos tras salir a bolsa. «Calculado» = sumando los días habituales; toca la etiqueta para ver la fuente.|End of the lock-ups after the IPO. «Estimated» = adding the usual days; tap the label to see the source.
Cuándo pueden vender empleados, inversores y fundadores de las empresas que salieron hace poco a bolsa. Mucha venta de golpe suele presionar el precio.|When employees, investors and founders of recently listed companies can sell. A lot of selling at once often weighs on the price.
Lo que viene|What's coming
Lo que viene en vuestras empresas|What's coming at your companies
Otras salidas a bolsa|Other recent IPOs
Dividendo|Dividend
Desbloqueo|Unlock
Desbloqueos|Unlocks
Junta|Meeting
Producto|Product
Conferencia|Conference
Regulador|Regulator
Índice|Index
Recompra|Buyback
Otro|Other
Eventos|Events
Estimado|Estimated
Sin fecha|No date
Ver las # fechas|See all # dates
Ver menos|See less
Nada a la vista en los próximos # meses.|Nothing coming up in the next # months.
Toca la etiqueta para ver la fuente.|Tap the label to see the source.
Auto = dato automático.|Auto = automatic data.
Dato automático de TradingView|Automatic data from TradingView
Con alarmas|With alerts
Acierto|Accuracy
Favoritas|Favourites
Coincidís en|You both watch
Todavía no coincidís en ninguna empresa|No companies in common yet
Logros|Achievements
Primera idea|First idea
Dibuja una idea sobre un gráfico|Draw an idea on a chart
Analista|Analyst
Cinco ideas dibujadas|Five drawn ideas
Tres ideas ganando a la vez|Three ideas winning at once
Diana|Bullseye
Una idea que llega a su objetivo|An idea that hits its target
Vigilante|Watchman
Tres alarmas puestas|Three alerts set
Cazador|Hunter
Una alarma que salta|An alert that fires
Inversor|Investor
Primera posición en la cartera|First portfolio position
Diversificado|Diversified
Cinco empresas en cartera|Five companies held
En verde|In the green
Cartera ganando dinero|Portfolio making money
Coleccionista|Collector
Cinco favoritas|Five favourites
Informado|Informed
Sigue tres empresas|Follows three companies
Leyenda|Legend
Alcanza el último rango|Reach the top rank
Novato|Rookie
Explorador|Explorer
Estratega|Strategist
Tiburón|Shark
Sin actividad todavía.|No activity yet.
Cambiar portada|Change cover
Nivel #|Level #
# puntos|# points
Faltan # para Explorador|# to Explorer
Faltan # para Analista|# to Analyst
Faltan # para Estratega|# to Strategist
Faltan # para Tiburón|# to Shark
Faltan # para Leyenda|# to Legend
Rango máximo|Top rank
en cartera|in portfolio
ganancia|gain
favoritas|favourites
Cómo van hoy|Today's moves
Mis ideas|My ideas
Todo lo que ha hecho|Everything done
Últimos movimientos|Latest moves
Ver perfil|View profile
Identidad|Identity
Sobre ti|About you
Qué buscas, qué te gusta, qué has aprendido|What you look for, like and learned
Tu estilo|Your style
Cuánto te arriesgas|Risk appetite
Tu meta|Your goal
Por ejemplo: llegar a 10.000|For example: reach 10,000
Inviertes desde|Investing since
Desde dónde|Where from
Tu color|Your colour
Tu frase aparecerá aquí|Your line shows here
Noticias|News
Nombre ▲|Name ▲
Nombre ▼|Name ▼
Precio ▲|Price ▲
Precio ▼|Price ▼
Hoy ▲|Today ▲
Hoy ▼|Today ▼
Semana ▲|Week ▲
Semana ▼|Week ▼
Mes ▲|Month ▲
Mes ▼|Month ▼
Año ▲|Year ▲
Año ▼|Year ▼
Capitalización ▲|Market cap ▲
Capitalización ▼|Market cap ▼
Volumen ▲|Volume ▲
Volumen ▼|Volume ▼
Actividad ▲|Activity ▲
Actividad ▼|Activity ▼
de vuestras empresas|from your companies
En directo|Live
cuentas que seguimos, solo lo importante|accounts we follow, important only
Importante|Important
Nada importante en las últimas horas.|Nothing important in the last hours.
Las cuentas aparecen en la próxima actualización.|Accounts appear on the next update.
Sin noticias importantes ahora mismo.|No important news right now.
Agenda|Calendar
Antes de abrir|Before open
Tras el cierre|After close
Datos que mueven el mercado|Market-moving data
Mañana|Tomorrow
o copia cualquier imagen y pégala con Ctrl+V|or copy any image and paste it with Ctrl+V
Qué parte se ve|Which part shows
Fotos en las cabeceras|Header photos
Con foto|With photo
Sin foto|No photo
Burbujas|Bubbles
Mosaico|Mosaic
Barras|Bars
Anillos|Rings
Lista|List
Cómo verlo|View as
No hay nada que enseñar aquí todavía.|Nothing to show here yet.
Ajustes|Settings
Cómo ver las empresas|How to view companies
Empresas por página|Companies per page
Animaciones|Animations
Con movimiento|Motion on
Todo quieto|Motion off
Cifras de la cartera|Portfolio figures
A la vista|Visible
Ocultas|Hidden
Idioma|Language
Se guardan en este dispositivo.|Saved on this device.
Las que más suben|Top gainers
Las que más bajan|Top losers
Donde más dinero se mueve|Most money traded
La lista completa|Full list
Más dinero|Most traded
Actividad rara|Unusual activity
Solo grandes|Large only
Medianas y grandes|Mid and large
También pequeñas|Include small
Ahora mismo no hay ninguna que cumpla.|None match right now.
Todo el mercado ordenado por lo que está pasando hoy. Para mirar, no para comprar a ciegas.|The whole market sorted by what is happening today. To watch, not to buy blindly.
Ocultas las empresas diminutas o casi sin volumen.|Tiny or barely traded companies are hidden.
Se ven todas, también las diminutas.|Showing all, tiny ones too.
Verlas también|Show them
Ocultarlas|Hide them
Volumen #x|Volume #x
Semana +#|Week +#
Semana -#|Week -#
Las # que más se mueven de #.|The # biggest movers out of #.
Todo el mercado|The whole market
Nuestras|Ours
Empresas|Companies
Valor total|Total value
Nombre|Name
Capitalización|Market cap
Actividad|Activity
Mayor capitalización|Largest market cap
Menor capitalización|Smallest market cap
Las que más suben hoy|Top gainers today
Las que más bajan hoy|Top losers today
Más volumen|Most volume
Actividad fuera de lo normal|Unusual activity
Precio más alto|Highest price
Precio más bajo|Lowest price
Nombre (A-Z)|Name (A-Z)
Todos los sectores|All sectors
Sector|Sector
Cualquier tamaño|Any size
Gigantes (+# mil M)|Mega (#B+)
Grandes (# a # mil M)|Large (# to #B)
Medianas (# a # mil M)|Mid (# to #B)
Pequeñas (menos de # mil M)|Small (under #B)
Cargando todas las empresas…|Loading all companies…
Ninguna empresa coincide con esos filtros.|No company matches those filters.
Esta empresa todavía no se vigila: el gráfico es el de TradingView. Poned una alarma o seguidla y en la próxima actualización aparecen sus noticias, vuestras velas y el dibujo de ideas.|Not tracked yet: this is TradingView's chart. Set an alarm or follow it and the next update adds its news, your candles and idea drawing.
Radar de alarmas|Alarm radar
Suben|Up
Bajan|Down
Mejor hoy|Best today
Peor hoy|Worst today
Todas|All
★ Favoritas|★ Favourites
Seguidas|Following
En cartera|Held
Con alarma|With alarm
Las que más suben|Top gainers
Las que más bajan|Top losers
Las que más se mueven|Biggest moves
Por nombre|By name
Filtrar por nombre o símbolo|Filter by name or symbol
Ordenar|Sort
Ninguna empresa coincide.|No company matches.
Aún no hay ninguna aquí. Buscad una arriba y marcadla como favorita o seguidla.|Nothing here yet. Search one above and add it to favourites or follow it.
Quitar de favoritas|Remove from favourites
Añadir a favoritas|Add to favourites
Poner alarma|Set alarm
‹ Anterior|‹ Previous
Siguiente ›|Next ›
#–# de #|#–# of #
Se está moviendo|Something is
algo|moving
El mercado|The market
de un vistazo|at a glance
Qué|Which
sectores|sectors
tiran|lead
Empresas grandes con más de un # de movimiento y mucho más volumen del normal. Para mirar, no para comprar a ciegas.|Large companies moving more than # on unusual volume. To watch, not to buy blindly.
Cada anillo es un sector entero.|Each ring is a whole sector.
Las # grandes: tamaño = valor, color = cómo va hoy.|The # biggest: size = value, colour = today's move.
Miedo: bolsa # · cripto #|Fear: stocks # · crypto #
Movimientos|Movers
Sectores|Sectors
Mapa|Map
Ahora mismo no hay movimientos raros.|No unusual moves right now.
vol #x|vol #x
Salud|Health
Básicos|Staples
Inmuebles|Real estate
Energía|Energy
Bancos|Banks
Comunicación|Communication
Consumo|Consumer
Materiales|Materials
Luz y agua|Utilities
Industria|Industrials
Tecnología|Technology
Chips|Chips
mes #|month #
mes +#|month +#
mes -#|month -#
Las monedas|Coins
tamaño = cuánto se mueven en # h|size = # h move
Miedo cripto|Crypto fear
Quién domina|Dominance
Resto|Others
Todo el mercado|Total market
Volumen # h|# h volume
# en # h|# in # h
Quién compra y quién vende bitcoin (ETF)|Who is buying and selling bitcoin (ETFs)
Quién compra y quién vende ethereum (ETF)|Who is buying and selling ethereum (ETFs)
# mes|# month
# meses|# months
Este año|This year
En total han|In total,
salido|flowed out
entrado|flowed in
en el último mes.|in the last month.
en los últimos # meses.|in the last # months.
en lo que va de año.|year to date.
Donde más han sacado:|Biggest outflows:
Donde más han metido:|Biggest inflows:
Nadie ha tenido salidas.|No fund had outflows.
. Ningún fondo ha recibido dinero. Entre todos guardan|. No fund received money. Together they hold
. Entre todos guardan|. Together they hold
Ningún fondo ha recibido dinero. Entre todos guardan|No fund received money. Together they hold
Entre todos guardan|Together they hold
▲ Entra dinero|▲ Money in
▼ Sale dinero|▼ Money out
han sacado · guarda # mil M|pulled out · holds #B
han sacado · guarda # M|pulled out · holds #M
han metido · guarda # mil M|added · holds #B
han metido · guarda # M|added · holds #M
# mil M $|$ #B
-# mil M $|-$ #B
+# mil M $|+$ #B
# M $|$ #M
-# M $|-$ #M
+# M $|+$ #M
# mil M|#B
# M|#M
(# mil M $),|($ #B),
(# M $),|($ #M),
(# mil M $)|($ #B)
(# M $)|($ #M)
Son los clientes de cada gestora comprando o vendiendo su fondo: los nombres de las personas no son públicos. Fuente: TradingView.|These are each manager's clients buying or selling the fund: individual names are not public. Source: TradingView.
Total día a día|Daily total
Empieza a dibujarse mañana: se calcula con las participaciones nuevas o retiradas de cada día.|Starts tomorrow: calculated from shares created or redeemed each day.
Precios|Prices
# días:|# days:
· tamaño # mil M $|· size $ #B
El mercado tiene|The market is in
# es pánico, # es euforia. Con mucho miedo suele haber rebajas; con mucha codicia, cuidado.|# is panic, # is euphoria. Extreme fear often means discounts; extreme greed, be careful.
La bolsa en el último año|Stocks over the last year
De qué está hecho|What it is made of
Fuerza del S&P #|S&P # momentum
Máximos frente a mínimos|Highs versus lows
Cuántas acciones suben|Market breadth
Apuestas a la baja|Put options
Nervios (VIX)|Volatility (VIX)
Apetito por riesgo|Risk appetite
Huida a lo seguro|Safe haven demand
Cripto, últimos # días|Crypto, last # days
VIX: los nervios en puntos|VIX: nerves in points
Ver velas|See candles
Ahora|Now
mercado muy tranquilo|very calm market
tranquilo|calm
nervioso|nervous
pánico|panic
hoy|today
Inflación PCE subyacente (la que mira la Fed)|Core PCE inflation (the Fed's gauge)
Inflación PCE|PCE inflation
Inflación IPC subyacente|Core CPI inflation
Inflación IPC|CPI inflation
Precios al productor (PPI)|Producer prices (PPI)
Empleo no agrícola (NFP)|Non-farm payrolls (NFP)
Tasa de paro|Unemployment rate
Peticiones de subsidio de paro|Jobless claims
Actas de la Fed|Fed minutes
Reunión de tipos de la Fed|Fed rate decision
Discurso del presidente de la Fed|Fed chair speech
PIB de EE.UU.|US GDP
Ventas minoristas|Retail sales
Índice de actividad (PMI/ISM)|Activity index (PMI/ISM)
Confianza del consumidor|Consumer confidence
Ofertas de empleo (JOLTS)|Job openings (JOLTS)
Quién|Who
presenta cuentas|reports earnings
Los resultados son lo que más mueve una acción. Las vuestras salen con aro verde.|Earnings move stocks more than anything. Yours are highlighted.
Esta semana|This week
La siguiente|Next week
En # semanas|In # weeks
Nada grande|Nothing big
Sin hora|Time TBC
sin hora|time TBC
Antes de abrir|Before open
antes de abrir|before open
Tras el cierre|After close
tras el cierre|after close
Datos que mueven todo|Market-moving data
Las vuestras|Yours
Ninguna de las vuestras presenta resultados en # semanas.|None of yours report in the next # weeks.
Nada pendiente esta semana.|Nothing pending this week.
Lo que|What we
tenemos|own
Entre los dos:|Together:
, hoy|, today
, en total|, overall
Apuntad lo que tenéis de verdad y aquí veis cuánto vale y cuánto lleva ganado.|Add what you really own and see its value and gain here.
Los dos|Both
Solo yo|Only me
Ocultar cifras|Hide figures
Mostrar cifras|Show figures
Mi cartera|My portfolio
Hoy -# $ · -#|Today -$# · -#
Hoy +# $ · +#|Today +$# · +#
Hoy # $ · #|Today $# · #
Total +# $ · +#|Total +$# · +#
Total -# $ · -#|Total -$# · -#
Total # $ · #|Total $# · #
Invertido # $|Invested $#
Añadir inversión|Add investment
Activo|Asset
Compra media|Avg. buy
Valor|Value
Ganancia|Gain
Compra de|Bought
apuntada ahora|added just now
apuntada hace # min|added # min ago
apuntada hace # h|added # h ago
apuntada hace # d|added # d ago
Otra compra|Another buy
Gráfico y noticias|Chart and news
Quitar esta compra|Remove this buy
Apunta lo que tienes de verdad y verás cuánto vale y cuánto llevas ganado.|Add what you really own to see its value and gain.
Añadir una inversión|Add an investment
Resumen|Overview
Alarmas|Alarms
Ideas|Ideas
Seguimiento|Watching
Lo|Our
nuestro|stuff
Todo lo que hace cada uno: alarmas, ideas, empresas seguidas y carteras.|Everything each of you does: alarms, ideas, followed companies and portfolios.
alarmas|alarms
acierta|hit rate
cartera|portfolio
ideas|ideas
Qué ha pasado entre nosotros|Recent activity
Empresas que seguimos|Companies we follow
Ver sus noticias|See their news
Todavía no hay nada. En cuanto pongáis una alarma, una idea o apuntéis una acción, sale aquí.|Nothing yet. Set an alarm, post an idea or add a stock and it shows up here.
Todavía no seguís ninguna.|You don't follow any yet.
ahora|now
hace # min|# min ago
hace # h|# h ago
hace # d|# d ago
en # min|in # min
en # h # m|in # h # m
en # días|in # days
ya salió|released
Radar de|Alarm
alarmas|radar
Cada logo se acerca al centro según se acerca a vuestro precio. Cuando llega, os avisa Discord con el porqué.|Each logo moves to the centre as the price nears your level. When it hits, Discord tells you why.
Nueva alarma|New alarm
▲ SUBE|▲ UP
▼ BAJA|▼ DOWN
SALTA|HIT
Borrar alarma|Delete alarm
Ya han saltado|Already triggered
El radar está vacío.|The radar is empty.
Elegid una empresa y decidle a qué precio avisar.|Pick a company and the price to alert at.
Poner la primera|Set the first one
Quién|Who gets it
acierta más|is right most
Cada idea dibujada, con su porcentaje de seguridad. El marcador se mueve con el precio.|Every drawn idea with its confidence. The score moves with the price.
Nueva idea: busca una empresa|New idea: search a company
# de # ideas a favor · media|# of # ideas in profit · average
· confianza media #|· average confidence #
Todas las ideas|All ideas
seguro|sure
cree que|thinks
▲ va a subir|▲ it goes up
▼ va a bajar|▼ it goes down
hasta|to
· ahora|· now
va ganando +#|winning +#
va perdiendo -#|losing -#
✔ objetivo cumplido|✔ target hit
Ver su gráfico|See their chart
Quitar dibujo|Hide drawing
Borrar mi idea|Delete my idea
Todavía no hay ideas.|No ideas yet.
Entrad en una empresa, pulsad «Dibujar mi idea» y marcad lo que creéis que va a pasar.|Open a company, press “Draw my idea” and mark what you think will happen.
En el|On the
punto de mira|watchlist
Las empresas que seguís, con sus últimas noticias importantes.|Companies you follow, with their latest important news.
Añadir|Add
▲ A favor|▲ Positive
▼ En contra|▼ Negative
● Neutro|● Neutral
Avisando en Discord|Alerting on Discord
Sin avisos|Alerts off
Dejar de seguir|Unfollow
Sus noticias llegan en la próxima actualización.|News arrives with the next update.
Todavía no seguís nada.|You are not following anything.
Buscad una empresa arriba y pulsad «Seguir noticias».|Search a company above and press “Follow news”.
Buscar empresa|Search company
Chat de ideas|Ideas chat
compartido|shared
solo en este navegador (sin conectar)|this browser only (not connected)
Aquí compartís ideas, gráficos y empresas.|Share ideas, charts and companies here.
Escribid el primer mensaje.|Write the first message.
Añadir imagen|Add image
Mencionar una empresa|Mention a company
Escribe una idea o pega un gráfico…|Write an idea or paste a chart…
Enviar|Send
borrar|delete
Imagen lista|Image ready
Pon tu frase, tu foto y tus favoritas.|Add your motto, photo and favourites.
Editar perfil|Edit profile
Cambiar clave|Change key
Escribirle|Message
su cartera|portfolio
Sus favoritas|Their favourites
Elige tus empresas favoritas: salen aquí y en tu inicio.|Pick your favourite companies: they show here and on Home.
Todavía no ha elegido favoritas.|No favourites yet.
Alarmas puestas|Alarms set
Sus ideas|Ideas
Fuera de horario # (-#)|After hours # (-#)
Fuera de horario # (+#)|After hours # (+#)
▼ -# hoy|▼ -# today
▲ +# hoy|▲ +# today
▲ # hoy|▲ # today
Seguir noticias|Follow news
En seguimiento|Following
La tengo|I own it
Favorita|Favourite
A favoritas|Add to favourites
Compartir en el chat|Share in chat
Diario|Daily
# hora|# hour
Dibujar mi idea|Draw my idea
Centrar|Reset
⛶ Grande|⛶ Full
✕ Salir|✕ Exit
Alejar|Zoom out
Acercar|Zoom in
Volver a la vista normal|Reset view
Pantalla completa|Full screen
Arrastra para moverte · botones + y − para acercar (o Ctrl + rueda) · «Grande» para verlo a pantalla completa|Drag to move · + and − to zoom (or Ctrl + wheel) · “Full” for full screen
Máx. y mín. de Asia|Asia high and low
Londres|London
Vuestras alarmas|Your alarms
Momento en que se publicó|When it was posted
El gráfico aparece en la próxima actualización.|The chart appears with the next update.
Escribe y pulsa Intro|Type and press Enter
Lo que está pasando|What's going on
Resumen con IA|AI summary
Muy positivo|Very positive
Positivo|Positive
Neutro|Neutral
Negativo|Negative
Muy negativo|Very negative
ambiente de|news
las noticias|mood
Resultados|Earnings
Su sector|Its sector
Ventas|Sales
Analistas|Analysts
Acuerdos|Deals
Legal y gobierno|Legal & government
Jefes de la empresa|Management
Acciones y dividendo|Shares & dividend
Productos y tecnología|Products & tech
Competencia|Competition
Mercado en general|Broad market
Qué dicen los analistas|What analysts say
opiniones|ratings
Comprar|Buy
Mantener|Hold
Vender|Sell
Precio que esperan en un año:|One-year price target:
Se equivocan a menudo: es una opinión, no un hecho.|They are often wrong: it is an opinion, not a fact.
Cómo le ha ido|Performance
# meses|# months
Dónde está el precio|Where the price sits
Rango de hoy|Today's range
Rango del último año|52-week range
Datos clave|Key figures
Tamaño|Size
valor en bolsa ($)|market value ($)
años de beneficios que pagas|years of earnings you pay
Volumen|Volume
frente a lo normal|vs. normal
próxima fecha|next date
Está esperando|Waiting for
Esta empresa todavía no se vigila. Poned una alarma o seguidla: en la próxima actualización (# min con el mercado abierto) aparecen sus noticias y sus velas.|This company isn't tracked yet. Set an alarm or follow it: news and candles arrive with the next update (# min while the market is open).
Otros indicadores|Other indicators
Sin datos todavía de este indicador.|No data for this indicator yet.
No tengo datos de esta moneda.|No data for this coin.
Últimos # días|Last # days
Con una alarma o siguiéndola aparecen sus velas.|Set an alarm or follow it to see its candles.
Datos|Figures
# días|# days
Desde su máximo|From all-time high
histórico|all time
Hoy entre|Today's range
¿De qué quieres que te avise?|What should I alert you about?
Nvidia, NQ, Bitcoin…|Nvidia, NQ, Bitcoin…
Avísame cuando llegue a|Alert me when it reaches
▲ si sube un #|▲ if it rises #
▼ si baja un #|▼ if it falls #
Guardar alarma|Save alarm
Porcentaje|Percentage
Pon un precio distinto del actual.|Enter a price different from the current one.
Cerrar|Close
Paso # de #|Step # of #
¿Qué has comprado?|What did you buy?
Rápido|Quick pick
Busca por nombre o símbolo|Search by name or symbol
Sé cuánto dinero puse|I know how much I invested
Sé cuántas tengo|I know how many I have
Dinero invertido (dólares)|Amount invested (dollars)
Cantidad (valen decimales)|Quantity (decimals allowed)
uds|units
Precio al que compraste|Price you paid
Precio de hoy|Today's price
Escribe la cantidad para ver el resumen|Enter the amount to see a summary
Tienes|You have
Vale ahora|Worth now
Guardar en mi cartera|Save to my portfolio
Elegir otra|Pick another
Falta la cantidad o el precio.|Amount or price missing.
La veis los dos. Es solo un apunte: aquí no se compra ni se vende nada.|Both of you see it. It is just a record: nothing is bought or sold here.
Mi perfil|My profile
Cómo te llamas aquí|Display name
Tu frase|Your motto
Por ejemplo: aquí se compra con miedo|For example: we buy the fear
Foto|Photo
Subir una foto|Upload photo
Quitar foto|Remove photo
…o el logo de una empresa o moneda|…or a company or coin logo
Color|Colour
Portada|Cover
Subir imagen|Upload image
Ninguna todavía|None yet
Añadir favorita…|Add favourite…
Guardar perfil|Save profile
Gráfico|Chart
Velas|Candles
Curvas|Curves
Horizonte|Horizon
Puntos|Dots
Líneas|Lines
Pon una clave que recuerdes. Mínimo # caracteres y algún número o guion: por ejemplo, tres palabras vuestras unidas con guiones. No uses la de otras webs.|Choose a key you can remember. At least # characters with a number or hyphen: for example three words of yours joined by hyphens. Don't reuse one from other sites.
Clave nueva|New key
Repítela|Repeat it
Ver lo que escribo|Show what I type
Cambiar mi clave|Change my key
Salir en este dispositivo|Sign out on this device
Las dos no son iguales.|They don't match.
¿Quién eres?|Who are you?
Pega tu clave personal. Solo hace falta una vez en este dispositivo.|Paste your personal key. Only needed once on this device.
Tu clave|Your key
Esa clave no es.|Wrong key.
Aún sin conectar|Not connected yet
La base compartida todavía no está puesta. De momento las alarmas y el chat se guardan solo en este navegador y no llegan a Discord.|The shared database isn't set up yet. For now alarms and chat stay in this browser and don't reach Discord.
Mover|Move
Línea|Line
Flecha|Arrow
Nivel|Level
Zona|Zone
Lápiz|Pencil
Texto|Text
Deshacer|Undo
Borrar todo|Clear all
Elige una herramienta y arrastra sobre el gráfico. El hueco de la derecha es el futuro. Con «Mover» te desplazas; arrastra los precios para estirar.|Pick a tool and drag on the chart. The space on the right is the future. Use “Move” to pan; drag the prices to stretch.
▲ Creo que sube|▲ I think up
▼ Creo que baja|▼ I think down
¿Cómo de seguro estás?|How sure are you?
Precio objetivo (opcional)|Target price (optional)
Se rellena con tu última flecha|Filled from your last arrow
Explica tu idea (opcional)|Explain your idea (optional)
Publicar mi idea|Publish my idea
Cancelar|Cancel
← Gráfico normal|← Normal chart
Como lo dibujó|As drawn
Sobre el precio de ahora|Over today's price
Alarma borrada|Alarm deleted
Alarma puesta|Alarm set
Perfil guardado|Profile saved
Quitada de favoritas|Removed from favourites
Añadida a tus favoritas|Added to your favourites
Idea borrada|Idea deleted
Quitado de tu cartera|Removed from your portfolio
Idea publicada: ya la podéis ver los dos|Idea published: you can both see it
Clave cambiada. Úsala en tus otros dispositivos.|Key changed. Use it on your other devices.
Mis opciones|My options
Añadir opción|Add option
Apunta tus puts y calls: verás cuánto valen, cuánto les falta y te avisamos en Discord antes de que venzan.|Log your puts and calls: see what they are worth, how far they need to go, and get a Discord alert before they expire.
Ya venció. Apunta cómo acabó para que cuente.|It has expired. Log how it ended so it counts.
Sin apuntar|Not logged
Vencida|Expired
Vence hoy|Expires today
Vence mañana|Expires tomorrow
Quedan # días|# days left
Pagaste|You paid
Si venciera hoy|If it expired today
Plazo|Time left
Ejercicio|Strike
Empate|Break-even
Si venciera hoy, ganarías.|If it expired today, you would profit.
Ya está en dinero. Le falta subir un # para empatar.|Already in the money. It needs to rise # to break even.
Ya está en dinero. Le falta bajar un # para empatar.|Already in the money. It needs to fall # to break even.
Le falta subir un # para llegar al ejercicio y un # para empatar.|It needs to rise # to reach the strike and # to break even.
Le falta bajar un # para llegar al ejercicio y un # para empatar.|It needs to fall # to reach the strike and # to break even.
Apuntar cómo acabó|Log how it ended
Quitar esta opción|Remove this option
Precio de los contratos: Nasdaq, con retraso. Solo son cuentas con vuestros números, no es un consejo.|Contract prices: Nasdaq, delayed. Just math on your numbers, not advice.
Las opciones aún no están activadas|Options are not enabled yet
¿De qué empresa es la opción?|Which company is the option on?
Vence el|Expires on
Prima que pagaste por acción|Premium you paid per share
Guardar opción|Save option
Escribe el ejercicio y la prima para ver el resumen|Enter the strike and premium to see the summary
Empatas en|Break-even at
Días|Days
Falta el precio de ejercicio.|The strike price is missing.
Elige una fecha de vencimiento de hoy en adelante.|Pick an expiry date from today on.
Falta la prima que pagaste.|The premium you paid is missing.
Pon cuántos contratos.|Enter how many contracts.
Opción guardada: la ves en Cartera|Option saved: you can see it in Portfolio
A cuánto la vendiste (prima por acción)|Sale price (premium per share)
Cerrar a este precio|Close at this price
Venció sin valor|Expired worthless
Escribe el precio de venta|Enter the sale price
Resultado|Result
Falta el precio.|The price is missing.
Opción cerrada|Option closed
Opción quitada|Option removed
Apuntar en mis opciones|Add to my options
Tus opciones|Your options
Cara a|Head to
cara|head
Hasta cuatro empresas: mueve y amplía todas a la vez.|Up to four companies: move and zoom them all at once.
Separadas|Side by side
Juntas en %|Together in %
Huecas|Hollow
Suaves|Smooth
Área|Area
Velas de|Candles of
Las velas de estas empresas aparecen en la próxima actualización.|Candles for these companies appear in the next update.
Las velas de|Candles for
aparecen en la próxima actualización. Sus datos ya están abajo.|appear in the next update. Their data is already below.
Arrastra para moverte. Pellizca, usa + y −, o la rueda con Ctrl para ampliar. Doble toque para centrar.|Drag to move. Pinch, use + and −, or Ctrl + wheel to zoom. Double tap to reset.
Sin velas en estas fechas|No candles for these dates
hasta ese día|up to that day
en lo que ves|in view
Quién va por delante|Who is ahead
Datos, lado a lado|Data, side by side
Precio ahora|Price now
antes o después del mercado|before or after the market
En lo que ves|In view
las fechas del gráfico|the chart dates
Riesgo, en las fechas del gráfico|Risk, over the chart dates
Mayor caída|Biggest drop
desde un máximo|from a high
Un día normal se mueve|A normal day it moves
arriba o abajo|up or down
Mejor día|Best day
Peor día|Worst day
Días en verde|Green days
Rango del año|Year range
dónde está entre mínimo y máximo|where it sits between low and high
Tamaño y valor|Size and value
valor en bolsa|market value
años de beneficios que pagas · menos es más barata|years of earnings you pay · lower is cheaper
Acciones al día|Shares per day
media en estas fechas|average over these dates
Dicen comprar|Say buy
se equivocan a menudo|they are often wrong
Precio que esperan|Price target
en un año|in a year
Margen hasta ese precio|Room to that price
Resultados y opciones|Earnings and options
Al presentar se mueve|Move on earnings
media de las últimas veces|average of the last times
Últimas veces|Last times
la más reciente primero|most recent first
Espera el mercado: 1 semana|Market expects: 1 week
según el precio de las opciones|from option prices
Espera el mercado: 1 mes|Market expects: 1 month
Puts por cada call|Puts per call
abiertas, a un mes|open, one month out
Ambiente|Mood
de sus noticias|from its news
Qué pasa|What is going on
¿Se mueven parecido?|Do they move alike?
Casi siempre van a la vez|Almost always move together
Suelen ir a la vez|Usually move together
A veces coinciden|Sometimes coincide
Cada una va a lo suyo|Each goes its own way
Suelen ir al revés|Usually move opposite
Lo que espera el mercado|What the market expects
Cargando precios de opciones…|Loading option prices…
Los precios de opciones salen para las empresas que vigiláis. Añádela a favoritas y aparecen en la siguiente actualización.|Option prices are available for companies you watch. Add it to favorites and they appear in the next update.
Se paga más movimiento del que suele hacer|Pricing a bigger move than usual
Se paga menos movimiento del que suele hacer|Pricing a smaller move than usual
Se paga lo que suele moverse|Pricing its usual move
entre|between
y|and
De media se movió|On average it moved
en sus últimos # resultados|on its last # earnings
Esperado|Expected
En # días|In # days
Sale del precio de una call y una put al precio de ahora: es lo que se está pagando, no una predicción.|Taken from the price of a call and a put at the current price: it is what is being paid, not a forecast.
Sale del precio de una call y una put al precio de ahora: es lo que se está pagando, no una predicción. Incluye todo lo que pueda pasar hasta ese vencimiento.|Taken from the price of a call and a put at the current price: it is what is being paid, not a forecast. It includes anything that may happen until that expiry.
Rango que espera el mercado|Range the market expects
Puts y calls|Puts and calls
Simulador|Simulator
Más fechas…|More dates…
Por cada call abierta hay|For every open call there are
puts en esta fecha|puts on this date
▲ Calls (ganan si sube)|▲ Calls (win if it rises)
▼ Puts (ganan si baja)|▼ Puts (win if it falls)
Ver solo los cercanos|Show nearby only
Ver los # precios|Show all # strikes
Toca un precio para apuntarlo, simularlo o calcular. Precio medio entre compra y venta, de Nasdaq y con retraso.|Tap a price to log or simulate it. Midpoint between bid and ask, from Nasdaq, delayed.
Precio por acción|Price per share
Un contrato cuesta|One contract costs
Tiene que subir|Needs to rise
Tiene que bajar|Needs to fall
Compra · venta|Bid · ask
Opciones de acabar en dinero|Odds of ending in the money
Abiertos|Open interest
Apuntar que la he comprado|Log that I bought it
Simular qué pasa si…|Simulate what if…
Cuentas orientativas con precios con retraso. No es un consejo.|Rough math with delayed prices. Not advice.
Aún no tengo el precio de esta empresa|I do not have this price yet
Aún no tengo precios de opciones de esta empresa|I do not have option prices for this company yet
Valdría|It would be worth
Ganarías o perderías|You would win or lose
Precio de la acción|Stock price
Ese día|That day
Al vencer|At expiry
Si la acción está en|If the stock is at
El día|On
del vencimiento|expiry day
Nervios del mercado|Market nerves
Mapa: precio y día|Map: price and day
Vence|Expiry
Es una estimación, no un precio seguro. Después de unos resultados los nervios suelen caer de golpe y la opción pierde valor: bájalos para verlo. No es un consejo.|This is an estimate, not a sure price. After earnings, nerves usually drop sharply and the option loses value: lower them to see it. Not advice.
Simular|Simulate
Alarma|Alert
Al chat|To chat
Avísame si gana|Alert me if it gains
Avísame si pierde|Alert me if it loses
Sin aviso|No alert
Guardar avisos|Save alerts
Quitar avisos|Remove alerts
Llega a Discord. Se mira cada pocos minutos con el mercado abierto, con precio de Nasdaq con retraso.|Sent to Discord. Checked every few minutes while the market is open, with delayed Nasdaq prices.
Cuando el contrato valga|When the contract is worth
: ganarías|: you would gain
: perderías|: you would lose
Alarma de opción guardada|Option alert saved
Avisos quitados|Alerts removed
Elige al menos un aviso.|Pick at least one alert.
La pérdida va de 1 a 100%.|The loss goes from 1 to 100%.
Avisa si gana +#|Alerts if it gains +#
Avisa si pierde -#|Alerts if it loses -#
Marcador de opciones|Options scoreboard
Cierra tu primera opción y empieza el marcador.|Close your first option to start the scoreboard.
Va por delante|Ahead
cerradas|closed
ganadas|won
Ganancia media|Average win
Pérdida media|Average loss
La mejor|Best
La peor|Worst
Racha|Streak
Ganadas|Won
Puts contra calls|Puts vs calls
Por empresa|By company
ninguna|none
Enviar al chat|Send to chat
Escribe algo (opcional)|Write something (optional)
Se ve con las cifras de cada momento.|Shown with live figures.
Enviado al chat|Sent to chat
Esa opción ya no está apuntada|That option is no longer logged
Esa inversión ya no está apuntada|That investment is no longer logged
Cerrada|Closed
La curva de vuestro dinero|Your money over time
Apunta una inversión con su fecha de compra y aquí aparece la curva: cuánto vale, cuánto lleva ganado y cómo va frente al S&P 500.|Log an investment with its purchase date and the chart appears here: what it is worth, what it has gained and how it compares to the S&P 500.
Cargando precios…|Loading prices…
Todavía no hay recorrido suficiente. Mañana se ve la curva.|Not enough history yet. The chart shows tomorrow.
En %|In %
Todo|All
Nada|None
Lo vuestro|Yours
Lo invertido|Invested
Compra|Purchase
Contar|Count
Desde que se compró|Since purchase
Como si ya lo tuvierais|As if you already held it
Comparar con|Compare with
Con opciones cerradas|Include closed options
Como no hay fechas de compra anteriores, se enseña cómo habría ido lo que tenéis hoy. Pon la fecha en cada compra (tócala en la tabla de abajo).|There are no earlier purchase dates, so this shows how today's holdings would have done. Set the date on each purchase (tap it in the table below).
Toca o pasa por la curva para ver un día. Arrastra para medir entre dos días.|Tap or hover to see a day. Drag to measure between two days.
desde un máximo del periodo|from a high in this period
Punto más alto|Highest point
Un día normal|A normal day
Quién ha puesto y quitado en el periodo|What added and subtracted in the period
Mes a mes|Month by month
Dónde está el dinero|Where the money is
Por sectores|By sector
activos|assets
Otros|Other
¿Cuándo lo compraste? (opcional)|When did you buy it? (optional)
Fecha de compra|Purchase date
Fecha de compra guardada|Purchase date saved
La curva de tu dinero|Your money chart
Alarma de opción|Option alert
Ver la publicación ↗|Open post ↗
Las compras sin fecha cuentan desde el día en que se apuntaron. Ponles la fecha (en la tabla de abajo) y la curva sale completa.|Purchases without a date count from the day they were logged. Set their date (in the table below) to see the full chart.
Lo último|Latest
Antes|Earlier
Qué espera el mercado|What the market expects
Toca las publicaciones|Tap the posts
Alarmas por %|% alerts
Miedo del mercado|Market fear
Fondos (ETF)|Funds (ETF)
Futuros|Futures
Efectivo|Cash
Las dos carteras|Both portfolios
Invertido|Invested
Opciones abiertas|Open options
Cerrado|Closed
Peso|Weight
Comprar más|Buy more
Empate #|Break-even #
Apunta cómo acabó|Log how it ended
Prima|Premium
Lo que tienes|What you hold
Apunta lo que tienes de verdad y verás cuánto vale, cuánto ganas y cómo va cada cosa.|Add what you really hold and see what it is worth, how much you make and how each one is doing.
Toca una fila para ver sus compras, venderla o cerrarla. Precios con retraso.|Tap a row to see its buys, sell it or close it. Delayed prices.
Reparto|Allocation
Tipo|Type
tipos|types
Otras|Others
Añadir efectivo|Add cash
Efectivo # $|Cash # $
El dinero sin invertir. Solo cuenta en el reparto.|Money not invested. It only counts in the allocation.
El dinero que tienes sin invertir. Sale en el reparto por tipo.|The money you have not invested. It shows in the allocation by type.
Guardar|Save
Pon una cantidad.|Enter an amount.
Efectivo guardado|Cash saved
Historial|History
Cuando vendas acciones o cierres una opción, aquí ves lo ganado y lo perdido, mes a mes.|When you sell shares or close an option, you see here what you won and lost, month by month.
Cerrado en total|Closed in total
# operaciones|# trades
# operación|# trade
# de # con ganancia|# of # in profit
Lo cerrado, mes a mes|Closed, month by month
Vendidas # a #|Sold # at #
Ver todo (#)|See all (#)
Deshacer la venta|Undo the sale
Venta deshecha: vuelve a tu cartera|Sale undone: back in your portfolio
va por delante|is ahead
Su mejor inversión|Best holding
Acierto al cerrar|Win rate when closing
Inversiones en verde|Holdings in profit
La carrera, en %|The race, in %
Solo porcentajes, para comparar aunque pongáis cantidades distintas.|Percentages only, so you can compare with different amounts.
Cuántas vendes|How many you sell
Precio de venta|Sale price
Fecha|Date
Pon cuántas y a qué precio|Enter how many and at what price
Recibes|You get
Sobre lo puesto|On what you put in
Vender # a #|Sell # at #
Vender a #|Sell at #
Es solo un apunte: aquí no se vende nada de verdad. Lo vendido pasa a tu historial.|It is only a note: nothing is really sold here. What you sell goes to your history.
Por delante # pts|Ahead by # pts
Por detrás # pts|Behind by # pts
La curva de su dinero|Their money curve
Lo tuyo|Yours
Venta|Sale
acciones y cripto|shares and crypto
Como no hay fechas de compra anteriores, se enseña cómo habría ido lo que tenéis hoy. Pon la fecha en cada compra (toca su fila en la lista de arriba).|As there are no earlier buy dates, it shows how what you hold today would have done. Add the date to each buy (tap its row in the list above).
Las compras sin fecha cuentan desde el día en que se apuntaron. Ponles la fecha (toca su fila en la lista de arriba) y la curva sale completa.|Buys without a date count from the day they were added. Add their date (tap its row in the list above) and the curve is complete.
Acciones, cripto u opciones|Shares, crypto or options
¿Cuándo lo compraste?|When did you buy it?
Call: ganas si sube|Call: you profit if it rises
Put: ganas si baja|Put: you profit if it drops
Precio de mercado ahora:|Market price now:
Tu cartera de un vistazo|Your portfolio at a glance
Vender e historial|Selling and history
Análisis|Analysis
Alcista|Bullish
Bajista|Bearish
▲ Alcista|▲ Bullish
▼ Bajista|▼ Bearish
◆ Neutral|◆ Neutral
▲ Alcistas|▲ Bullish
▼ Bajistas|▼ Bearish
◆ Neutrales|◆ Neutral
Esperando la entrada|Waiting for entry
En marcha|Running
Objetivo cumplido|Target hit
Tocó el stop|Stop hit
Se acabó el plazo|Time is up
Se cumplió|It held
Se salió del rango|It left the range
No llegó a entrar|Never entered
Objetivo # ✓|Target # ✓
Objetivo # de # ✓|Target # of # ✓
# a #|# to #
Se queda entre|Stays between
Objetivos|Targets
a +#|+# away
a -#|-# away
a #|to #
quedan # días|# days left
acaba mañana|ends tomorrow
acaba hoy|ends today
Idea dibujada|Drawn idea
Dibujo|Drawing
Al historial|To history
Borrar este análisis|Delete this analysis
Seguridad|Confidence
Lo que ganas por cada 1 que arriesgas|What you make for each 1 you risk
Análisis de|Analyses by
Nuevo análisis|New analysis
Apunta qué esperas: entrada, objetivo y stop. Se mueve con el precio.|Note what you expect: entry, target and stop. It moves with the price.
# en el historial|# in history
Mis|My
Vuestros|Your
análisis|analyses
Qué esperas de cada empresa: entrada, objetivo y stop. Se mueve con el precio.|What you expect from each company: entry, target and stop. It moves with the price.
Todavía no hay análisis. Elige una empresa y apunta qué esperas: entrada, objetivo y stop.|No analyses yet. Pick a company and note what you expect: entry, target and stop.
Ningún análisis abierto. Los terminados están en el historial.|No open analyses. Finished ones are in the history.
# esperando entrada|# waiting for entry
Van a favor|Going your way
de los que ya entraron|of those already in
# de # terminados|# of # finished
Media al acertar|Average when right
sin fallos|no misses
al fallar -#|when wrong -#
Cuando un análisis llegue al objetivo, toque el stop o se acabe su plazo, aparece aquí con su resultado.|When an analysis hits its target, its stop or runs out of time, it shows up here with its result.
de #|of #
acierto|win rate
Mejor|Best
peor|worst
¿De qué empresa?|Which company?
Como mucho # análisis abiertos por empresa. Cierra uno para apuntar otro.|At most # open analyses per company. Close one to add another.
Editar análisis|Edit analysis
Tu idea en pocas palabras|Your idea in a few words
Entrada desde|Entry from
Vacío: entras al precio de ahora.|Empty: you enter at the current price.
Objetivo #|Target #
Hasta cuándo|Until when
# semana|# week
Cómo de seguro estás ·|How sure you are ·
Por qué (opcional)|Why (optional)
Guardar análisis|Save analysis
Guardar cambios|Save changes
Dibujar en el gráfico|Draw on the chart
Lo veis los dos. Sin importes: solo precios. No es un consejo.|You both see it. No amounts: prices only. Not advice.
Máx. # mes|# month high
Máx. # meses|# months high
Máx. # año|# year high
Mín. # mes|# month low
Mín. # meses|# months low
Mín. # año|# year low
Ganas|You make
Arriesgas|You risk
Rango|Range
Pon entre qué precios se queda.|Enter the prices it stays between.
El precio de ahora (#) tiene que quedar dentro del rango.|The current price (#) has to be inside the range.
Pon al menos el objetivo o el stop.|Enter at least the target or the stop.
En un alcista los objetivos van por encima de la entrada.|In a bullish one the targets go above the entry.
En un bajista los objetivos van por debajo de la entrada.|In a bearish one the targets go below the entry.
En un alcista el stop va por debajo de la entrada.|In a bullish one the stop goes below the entry.
En un bajista el stop va por encima de la entrada.|In a bearish one the stop goes above the entry.
Aún no tengo el precio de esta empresa.|I do not have this company's price yet.
Análisis guardado|Analysis saved
Análisis cerrado: está en el historial|Analysis closed: it is in the history
Análisis publicado: ya lo podéis ver los dos|Analysis published: you can both see it now
Cerrar análisis|Close analysis
Precio al cerrarlo|Price when closing
Precio de ahora|Current price
Cerrar y pasar al historial|Close and move to history
Hasta|Until
Tu idea en pocas palabras (opcional)|Your idea in a few words (optional)
Ver análisis|See analyses
Publicar mi análisis|Publish my analysis
Análisis con su plan|Analyses with their plan
Yo|Me
`;

const exactas = new Map();
for (const linea of DICCIONARIO.split('\n')) { const [es, en] = linea.split('|'); if (es && en !== undefined && !exactas.has(es)) exactas.set(es, en); }
const NUM = /\$?[0-9][0-9.,:%]*/g;
const REGLAS = [
  [/^Análisis de (.*) guardado$/, '$1 analysis saved'],
  [/^Análisis de (.*)$/, '$1 analyses'],
  [/^Ya tienes (\d+) análisis abiertos de (.*): cierra uno$/, 'You already have $1 open analyses for $2: close one'],
  [/^Ya tienes (\d+) de (.*)$/, 'You already have $1 for $2'],
  [/^Ver los de (.*)$/, 'See the $1 ones'],
  [/^cree que (.*) se queda en rango \((.*) seguro\)$/, 'thinks $1 stays in a range ($2 sure)'],
  [/^hasta el (.*)$/, 'until $1'],
  [/^(.*) va por delante$/, '$1 is ahead'],
  [/^Vendido: (.*)$/, 'Sold: $1'],
  [/^Venta de (.*)$/, 'Sold $1'],
  [/^vendió (.*)$/, 'sold $1'],
  [/^Para sus resultados del (.*)$/, (m, a) => `For its earnings on ${a}`],
  [/^De aquí al (.*)$/, 'From now to $1'],
  [/^Resultados el (.*?): la comparación con su historia sale cuando falten 3 semanas\.$/, 'Earnings on $1: the history comparison appears 3 weeks before.'],
  [/^(Sale del precio.*?no una predicción\.) Resultados el (.*?): la comparación.*$/, 'Taken from the price of a call and a put at the current price: it is what is being paid, not a forecast. Earnings on $2: the history comparison appears 3 weeks before.'],
  [/^(.*) abiertos$/, '$1 open'],
  [/^Precio ahora (.*)$/, 'Price now $1'],
  [/^(\d+) d$/, '$1 d'],
  [/^Qué pasa si… · (.*)$/, 'What if… · $1'],
  [/^Vence el (.*?) · pagado (.*)$/, 'Expires $1 · paid $2'],
  [/^Vence el (.*?) · (\d+) días$/, 'Expires $1 · $2 days'],
  [/^Vence el (.*?) · de (.*)$/, 'Expires $1 · by $2'],
  [/^Cerrada · de (.*)$/, 'Closed · by $1'],
  [/^Alarma · (.*)$/, 'Alert · $1'],
  [/^Pagaste (.*?) por acción · ahora (.*)$/, 'You paid $1 per share · now $2'],
  [/^Pagaste (.*?) por acción$/, 'You paid $1 per share'],
  [/^(\d+) ganando$/, '$1 winning'], [/^(\d+) perdiendo$/, '$1 losing'],
  [/^(\d+) de (\d+)$/, '$1 of $2'], [/^(.*) de (\d+)$/, '$1 of $2'],
  [/^(.*) en cartera$/, '$1 in portfolio'],
  [/^de (.*?) · compra media (.*)$/, 'by $1 · average price $2'],
  [/^Compra media (.*)$/, 'Average price $1'],
  [/^Mismo dinero en (.*)$/, 'Same money in $1'],
  [/^Desde el (.*)$/, 'Since $1'],
  [/^En el periodo (.*)$/, 'In period $1'],
  [/^Vais por delante (.*) puntos$/, 'You are ahead by $1 points'],
  [/^Vais por detrás (.*) puntos$/, 'You are behind by $1 points'],
  [/^Invertido (.*)$/, 'Invested $1'],
  [/^Ganancia total (.*)$/, 'Total gain $1'],
  [/^Ese día (.*)$/, 'That day $1'],
  [/^Compra de (.*)$/, 'Bought $1'],
  [/^comprada el (.*)$/, 'bought $1'],
  [/^Sin histórico todavía de (.*): aparece en las próximas actualizaciones\.$/, 'No history yet for $1: it appears in the next updates.'],
  [/^De (.*) solo hay datos básicos hasta la próxima actualización\.$/, 'Only basic data for $1 until the next update.'],
  [/^por (.*) puntos$/, 'by $1 points'],
  [/^hoy (.*$|••••)$/, 'today $1'],
  [/^(.*) · (d+) alarmas?(.*)$/, (m, a, b, c) => `${a} · ${b} alarm(s)${c.replace('seguida', 'following')}`],
  [/^(.*) · seguida$/, '$1 · following'],
  [/^((.*)). Ningún fondo ha recibido dinero. Entre todos guardan$/, '($1). No fund received money. Together they hold'],
  [/^· tamaño (.*)$/, '· size $1'],
  [/^mín (.*) · máx (.*)$/, 'low $1 · high $2'],
  [/^ahora · entonces$/, 'now · then'],
  [/^Máx ([0-9.,]+)$/, 'High $1'], [/^Mín ([0-9.,]+)$/, 'Low $1'], [/^A ([0-9.,]+)$/, 'O $1'],
  [/^(.*) · ahora (.*)$/, '$1 · now $2'],
  [/^Dibuja tu idea sobre (.*)$/, 'Draw your idea on $1'],
  [/^(.*) puso una alarma: (.*) sube a (.*)$/, '$1 set an alarm: $2 rises to $3'],
  [/^puso una alarma: (.*) sube a (.*)$/, 'set an alarm: $1 rises to $2'],
  [/^puso una alarma: (.*) baja a (.*)$/, 'set an alarm: $1 falls to $2'],
  [/^saltó su alarma de (.*) a (.*)$/, 'alarm triggered: $1 at $2'],
  [/^cree que (.*) va a subir \((.*) seguro\)$/, 'thinks $1 goes up ($2 sure)'],
  [/^cree que (.*) va a bajar \((.*) seguro\)$/, 'thinks $1 goes down ($2 sure)'],
  [/^empezó a seguir (.*)$/, 'started following $1'],
  [/^apuntó (.*) en su cartera$/, 'added $1 to their portfolio'],
  [/^Cartera de (.*)$/, "$1's portfolio"],
  [/^(.*) todavía no ha apuntado nada\.$/, '$1 has not added anything yet.'],
  [/^la sigue (.*)$/, 'followed by $1'],
  [/^Eres (.*)$/, 'You are $1'],
  [/^Idea de (.*) · (.*) seguro$/, "$1's idea · $2 sure"],
  [/^Qué pensamos de (.*)$/, 'What we think about $1'],
  [/^Noticias de (.*)$/, '$1 news'],
  [/^falta un (.*) · (.*)$/, '$1 to go · $2'],
  [/^¡Saltó! a (.*)$/, 'Hit at $1'],
  [/^puesta por (.*)$/, 'set by $1'],
  [/^(.*) · (hace .*)$/, (m, a, b) => `${a} · ${traduce(b)}`],
  [/^(.*) · esperan (.*)$/, '$1 · expected $2'],
  [/^Leído (.*?) · empresas de más de 2 mil millones · datos con 15 min de retraso$/, (m, a) => `Read ${traduce(a)} · companies above 2B · data delayed 15 min`],
  [/^(.*) · (.*) acciones$/, '$1 · $2 shares'],
  [/^Ganó (.*) por acción, esperaban (.*)$/, 'EPS $1, expected $2'],
  [/^Además, si en un día se mueve un (.*?) o más os avisa solo, sin poner nada.$/, 'Also, a daily move of $1 or more alerts you automatically.'],
  [/^Hoy ([+-].*|—)$/, 'Today $1'],
  [/^▲ si sube a (.*?)( \(ya pasado\))?$/, (m, a, b) => `▲ if it rises to ${a}${b ? ' (already passed)' : ''}`],
  [/^▼ si baja a (.*?)( \(ya pasado\))?$/, (m, a, b) => `▼ if it drops to ${a}${b ? ' (already passed)' : ''}`],
  [/^(.*) · (d+) alarma(s?) · (.*)$/, '$1 · $2 alert$3 · $4'],
  [/^· hace (\d+) (min|h|d)( ·)?$/, '· $1 $2 ago$3'],
  [/^· ahora( ·)?$/, '· now$1'],
  [/^Siguiendo (.*): lo importante irá a Discord$/, 'Following $1: important news goes to Discord'],
  [/^Siguiendo (.*)$/, 'Following $1'],
  [/^Ya no seguís (.*)$/, 'Stopped following $1'],
  [/^Alarma puesta: (.*) a (.*)$/, 'Alarm set: $1 at $2'],
  [/^Guardada solo aquí: (.*) a (.*)$/, 'Saved only here: $1 at $2'],
  [/^Guardado en tu cartera: (.*)$/, 'Saved to your portfolio: $1'],
  [/^Hola, (.*)$/, 'Hi, $1'],
  [/^(.*) \(tú\)$/, '$1 (you)'],
  [/^(\d+) alarmas?$/, '$1 alarm(s)'],
  [/^Opciones de (.*)$/, "$1's options"],
  [/^apuntó un (put|call) de (.*)$/, 'logged a $2 $1'],
  [/^En juego (.*)$/, 'At stake $1'], [/^Abiertas (.*)$/, 'Open $1'], [/^Cerradas (.*)$/, 'Closed $1'],
  [/^Cerrar (\S+ (?:Put|Call) .*)$/, 'Close $1'],
];
function traduce(texto) {
  const limpio = texto.replace(/\s+/g, ' ').trim();
  if (!limpio) return texto;
  const ponerBordes = (t) => (/^\s/.test(texto) ? ' ' : '') + t.replace(/(\d) \$(?!\{)/g, '$1\u00a0$') + (/\s$/.test(texto) ? ' ' : '');
  if (exactas.has(limpio)) return ponerBordes(exactas.get(limpio));
  const numeros = limpio.match(NUM) || [];
  const clave = limpio.replace(NUM, '#');
  if (exactas.has(clave)) { let i = 0; return ponerBordes(exactas.get(clave).replace(/#/g, () => numeros[i++] ?? '')); }
  for (const [re, por] of REGLAS) if (re.test(limpio)) return ponerBordes(limpio.replace(re, por));
  return texto;
}
if (EN) {
  document.documentElement.lang = 'en';
  // lo que escribis vosotros no se toca
  const propio = (el) => el.closest('.burb2, .cuerpo-idea p, .an-nota, .an-propio, script, style, textarea');
  const nodo = (n) => { if (n.parentElement && !propio(n.parentElement)) { const t = traduce(n.nodeValue); if (t !== n.nodeValue) n.nodeValue = t; } };
  const atributos = (el) => { for (const a of ['placeholder', 'title', 'aria-label']) { const v = el.getAttribute?.(a); if (v) { const t = traduce(v); if (t !== v) el.setAttribute(a, t); } } };
  const todo = (raiz) => {
    if (raiz.nodeType === 3) return nodo(raiz);
    if (raiz.nodeType !== 1) return;
    atributos(raiz); raiz.querySelectorAll('[placeholder],[title],[aria-label]').forEach(atributos);
    const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) nodo(n);
  };
  new MutationObserver((cambios) => {
    for (const c of cambios) {
      if (c.type === 'childList') c.addedNodes.forEach(todo);
      else if (c.type === 'characterData') nodo(c.target);
      else atributos(c.target);
    }
  }).observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label'] });
  document.addEventListener('DOMContentLoaded', () => todo(document.body));
}
