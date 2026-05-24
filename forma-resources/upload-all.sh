#!/bin/bash
# FORMA — Bulk upload all 24 resources via API
# Usage: bash upload-all.sh

API="http://localhost:8080/api"
BASE="$(cd "$(dirname "$0")" && pwd)"

# Login
echo "=== Logging in... ==="
LOGIN=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"reyn07yt@gmail.com","password":"11854731Dima"}')

TOKEN=$(echo "$LOGIN" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "FATAL: login failed"
  echo "$LOGIN"
  exit 1
fi
echo "Token obtained."

upload() {
  local name="$1"
  local desc="$2"
  local typeId="$3"
  local licenseId="$4"
  local price="$5"
  local file="$6"
  local preview="$7"
  local fontFamily="${8:-}"
  local fontStyle="${9:-}"
  local fontFormat="${10:-}"

  echo -n "  Uploading: $name ... "

  local CMD=(curl -s -X POST "$API/resources"
    -H "Authorization: Bearer $TOKEN"
    -F "name=$name"
    -F "description=$desc"
    -F "typeId=$typeId"
    -F "licenseId=$licenseId"
    -F "price=$price"
    -F "files=@$file"
  )

  if [ -f "$preview" ]; then
    CMD+=(-F "preview=@$preview")
  fi

  if [ -n "$fontFamily" ]; then
    CMD+=(-F "fontFamily=$fontFamily")
    CMD+=(-F "fontStyle=$fontStyle")
    CMD+=(-F "fontFormat=$fontFormat")
  fi

  RESULT=$("${CMD[@]}" 2>&1)

  if echo "$RESULT" | grep -q '"id"'; then
    local rid=$(echo "$RESULT" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
    echo "OK (id=$rid)"
  else
    echo "FAIL"
    echo "    $RESULT"
  fi
}

echo ""
echo "=== FONTS (typeId=1) ==="

upload "Roboto" \
  "Roboto — современный геометрический шрифт от Google. Идеально подходит для UI-дизайна, веб-приложений и мобильных интерфейсов. Поддерживает кириллицу и латиницу. Один из самых популярных шрифтов в мире." \
  1 1 0 \
  "$BASE/fonts/01-roboto/Roboto.ttf" \
  "$BASE/fonts/01-roboto/preview.svg" \
  "Roboto" "Regular" "TTF"

upload "Montserrat" \
  "Montserrat — элегантный шрифт, вдохновлённый вывесками Буэнос-Айреса. Отлично подходит для заголовков, логотипов и навигации. Полная поддержка кириллицы. 18 начертаний." \
  1 1 0 \
  "$BASE/fonts/02-montserrat/Montserrat.ttf" \
  "$BASE/fonts/02-montserrat/preview.svg" \
  "Montserrat" "Regular" "TTF"

upload "Playfair Display" \
  "Playfair Display — изысканный антиквенный шрифт с высоким контрастом штрихов. Создан для крупных заголовков, журнальной вёрстки и премиальных брендов. Поддержка кириллицы." \
  1 2 299 \
  "$BASE/fonts/03-playfair-display/PlayfairDisplay.ttf" \
  "$BASE/fonts/03-playfair-display/preview.svg" \
  "Playfair Display" "Regular" "TTF"

upload "Nunito" \
  "Nunito — дружелюбный округлый шрифт с мягкими формами букв. Идеально подходит для образовательных проектов, детских приложений и креативных лендингов. Кириллица + латиница." \
  1 1 0 \
  "$BASE/fonts/04-nunito/Nunito.ttf" \
  "$BASE/fonts/04-nunito/preview.svg" \
  "Nunito" "Regular" "TTF"

upload "Raleway" \
  "Raleway — утончённый шрифт с тонкими элегантными линиями. Подходит для модных брендов, портфолио дизайнеров и минималистичных сайтов. 18 начертаний с поддержкой кириллицы." \
  1 3 199 \
  "$BASE/fonts/05-raleway/Raleway.ttf" \
  "$BASE/fonts/05-raleway/preview.svg" \
  "Raleway" "Regular" "TTF"

upload "Fira Code" \
  "Fira Code — моноширинный шрифт с лигатурами для программирования. Поддерживает 100+ лигатур (=>, !==, <=), что делает код более читаемым. Идеален для IDE и терминалов." \
  1 1 0 \
  "$BASE/fonts/06-fira-code/FiraCode.ttf" \
  "$BASE/fonts/06-fira-code/preview.svg" \
  "Fira Code" "Regular" "TTF"

echo ""
echo "=== ICONS (typeId=2) ==="

upload "UI Basic Icons" \
  "Базовый набор из 18 иконок для интерфейсов: дом, поиск, пользователь, сердце, звезда, настройки, почта, колокольчик, корзина, галочка, плюс, удаление, редактирование, скачивание, загрузка, глаз, замок, изображение. SVG формат, 24x24px." \
  2 1 0 \
  "$BASE/icons/01-ui-basic/01-ui-basic.svg" \
  "$BASE/icons/01-ui-basic/preview.svg"

upload "Social Media Icons" \
  "Набор иконок для социальных сетей и коммуникаций: глобус, поделиться, ссылка, сообщение, лайк, почта. Идеальны для блогов, лендингов и контактных страниц. SVG формат." \
  2 3 149 \
  "$BASE/icons/02-social-media/02-social-media.svg" \
  "$BASE/icons/02-social-media/preview.svg"

upload "Business Icons" \
  "Профессиональный набор бизнес-иконок: портфель, график, доллар, календарь, часы, настройки, почта, пользователь, замок, поиск, скачивание, редактирование. Для корпоративных сайтов и приложений." \
  2 2 249 \
  "$BASE/icons/03-business/03-business.svg" \
  "$BASE/icons/03-business/preview.svg"

upload "Arrows & Navigation" \
  "Набор стрелок и навигационных иконок: стрелки, шевроны, меню, крестик, внешняя ссылка, обновление. Незаменимы для навигации, кнопок и элементов управления. SVG 24x24px." \
  2 1 0 \
  "$BASE/icons/04-arrows-nav/04-arrows-nav.svg" \
  "$BASE/icons/04-arrows-nav/preview.svg"

upload "Weather Icons" \
  "Набор погодных иконок: солнце, облако, капля, ветер, термометр, снежинка. Для погодных виджетов, приложений прогноза и метео-сервисов. SVG формат, линейный стиль." \
  2 3 199 \
  "$BASE/icons/05-weather/05-weather.svg" \
  "$BASE/icons/05-weather/preview.svg"

upload "E-commerce Icons" \
  "Набор иконок для интернет-магазинов: тег, кредитная карта, грузовик, подарок, процент, посылка, корзина, сердце, звезда, поиск, пользователь, настройки. SVG формат." \
  2 3 179 \
  "$BASE/icons/06-ecommerce/06-ecommerce.svg" \
  "$BASE/icons/06-ecommerce/preview.svg"

echo ""
echo "=== ILLUSTRATIONS (typeId=3) ==="

upload "Remote Work" \
  "Векторная иллюстрация на тему удалённой работы. Рабочее место с ноутбуком, растение и облачные элементы. Идеальна для лендингов, блогов и презентаций о фрилансе и удалёнке." \
  3 1 0 \
  "$BASE/illustrations/01-remote-work/01-remote-work.svg" \
  "$BASE/illustrations/01-remote-work/preview.svg"

upload "Business Team" \
  "Иллюстрация командной работы в бизнесе. Абстрактные фигуры людей с диаграммами и графиками роста. Подходит для корпоративных сайтов, HR-порталов и бизнес-презентаций." \
  3 2 399 \
  "$BASE/illustrations/02-business-team/02-business-team.svg" \
  "$BASE/illustrations/02-business-team/preview.svg"

upload "Creative Design" \
  "Яркая иллюстрация на тему креативного дизайна. Палитра, кисть, геометрические фигуры и абстрактные формы. Для портфолио дизайнеров, креативных агентств и студий." \
  3 1 0 \
  "$BASE/illustrations/03-creative-design/03-creative-design.svg" \
  "$BASE/illustrations/03-creative-design/preview.svg"

upload "Tech Innovation" \
  "Технологическая иллюстрация с элементами инноваций: процессор, микросхема, связи, абстрактные формы. Для IT-компаний, стартапов и технологических продуктов." \
  3 2 499 \
  "$BASE/illustrations/04-tech-innovation/04-tech-innovation.svg" \
  "$BASE/illustrations/04-tech-innovation/preview.svg"

upload "Education" \
  "Образовательная иллюстрация с книгами, лампочкой-идеей и академическими элементами. Для образовательных платформ, онлайн-курсов и учебных материалов." \
  3 3 299 \
  "$BASE/illustrations/05-education/05-education.svg" \
  "$BASE/illustrations/05-education/preview.svg"

upload "Data Analytics" \
  "Аналитическая иллюстрация с диаграммами, графиками и дашбордом. Для маркетинговых отчётов, аналитических платформ и бизнес-дашбордов. Минималистичный стиль." \
  3 1 0 \
  "$BASE/illustrations/06-data-analytics/06-data-analytics.svg" \
  "$BASE/illustrations/06-data-analytics/preview.svg"

echo ""
echo "=== TEMPLATES (typeId=4 UI-киты) ==="

upload "Landing Page Template" \
  "Современный HTML-шаблон лендинга с адаптивным дизайном. Включает hero-секцию, блок преимуществ, секцию отзывов и форму обратной связи. Tailwind CSS. Готов к продакшену." \
  4 2 599 \
  "$BASE/templates/01-landing-page/01-landing-page.html" \
  "$BASE/templates/01-landing-page/preview.svg"

upload "Business Card Template" \
  "Минималистичный шаблон визитной карточки в HTML/CSS. Двусторонний дизайн с логотипом, контактными данными и QR-кодом. Легко кастомизируется. Печать 90x50мм." \
  4 1 0 \
  "$BASE/templates/02-business-card/02-business-card.html" \
  "$BASE/templates/02-business-card/preview.svg"

upload "Presentation Template" \
  "HTML-шаблон презентации с 5 слайдами. Минималистичный дизайн с градиентами, анимациями перехода. Подходит для стартап-питчей, отчётов и конференций." \
  4 2 399 \
  "$BASE/templates/03-presentation/03-presentation.html" \
  "$BASE/templates/03-presentation/preview.svg"

upload "Portfolio Template" \
  "Элегантный шаблон портфолио дизайнера. Сетка проектов с hover-эффектами, секция О себе, контактная форма. Адаптивный, готов к кастомизации. HTML + CSS." \
  4 2 499 \
  "$BASE/templates/04-portfolio/04-portfolio.html" \
  "$BASE/templates/04-portfolio/preview.svg"

upload "Email Newsletter Template" \
  "Готовый шаблон email-рассылки. Совместим с Gmail, Outlook, Apple Mail. Адаптивная верстка на таблицах. Включает шапку, блок новостей, CTA-кнопку и подвал." \
  4 3 299 \
  "$BASE/templates/05-email-newsletter/05-email-newsletter.html" \
  "$BASE/templates/05-email-newsletter/preview.svg"

upload "Resume CV Template" \
  "Чистый минималистичный шаблон резюме CV. Двухколоночный дизайн, секции опыта, навыков и образования. HTML + CSS, легко кастомизируется. Подходит для печати формата A4." \
  4 1 0 \
  "$BASE/templates/06-resume/06-resume.html" \
  "$BASE/templates/06-resume/preview.svg"

echo ""
echo "=== DONE! ==="
echo "Now publishing all resources..."

# Publish all PENDING resources
curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"reyn07yt@gmail.com","password":"11854731Dima"}' > /dev/null

echo "Run this SQL to publish: UPDATE resources SET status='PUBLISHED' WHERE status='PENDING';"
