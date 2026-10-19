# Why Choose Us Section - Figma UI/UX Design

## Design Overview
صفحة إنشاء قسم "Why Choose Us" بتصميم احترافي وحديث

---

## 🎨 Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | #4F46E5 (Indigo) | Buttons, Focus States, Active States |
| Primary Light | #6366F1 | Hover States |
| Secondary | #A78BFA (Purple) | Accents |
| Background | #F8FAFC (Light Slate) | Page Background |
| Card Background | #FFFFFF | Form Cards |
| Text Primary | #1F2937 (Dark Gray) | Main Text |
| Text Secondary | #6B7280 (Gray) | Secondary Text |
| Border | #E5E7EB (Light Gray) | Borders |
| Success | #10B981 (Green) | Success States |
| Error | #EF4444 (Red) | Error States |
| Warning | #F59E0B (Amber) | Warning States |

---

## 📐 Typography

### Headings
- **H1 (Page Title)**: 36px, Bold (600), Color: Gradient (Indigo → Purple)
- **H2 (Section Title)**: 24px, Semibold (600), Color: #1F2937
- **H3 (Form Labels)**: 14px, Semibold (600), Color: #1F2937
- **Body Text**: 16px, Regular (400), Color: #6B7280
- **Input Label**: 12px, Semibold (600), Color: #374151

### Font Family
- Primary: Inter
- Fallback: Segoe UI, Roboto, sans-serif

---

## 🏗️ Layout Structure

### Desktop (1440px)
- Max Width Container: 1152px (80% of viewport)
- Padding: 48px horizontal, 64px vertical
- Spacing between sections: 96px

### Tablet (768px)
- Padding: 32px horizontal
- Spacing between sections: 64px
- Grid: 2 columns

### Mobile (375px)
- Padding: 16px horizontal
- Spacing between sections: 32px
- Grid: 1 column

---

## 📱 Components

### 1. Header Section
```
┌─────────────────────────────────────────┐
│  Add Why Choose Us Section              │
│  Showcase the key reasons why clients   │
│  should choose your business.           │
└─────────────────────────────────────────┘

Spacing: 64px bottom
```

**Design Details:**
- Title: 36px, Bold, Gradient Text
- Subtitle: 18px, Regular, Gray
- Centered alignment
- Max width: 672px for text

---

### 2. Section 1: Basic Information
```
┌──────────────────────────────────────────────┐
│ ① Basic Information                          │
├──────────────────────────────────────────────┤
│                                              │
│ Section Title                                │
│ [Input Field...........................]      │
│                                              │
│ Subtitle                                     │
│ [Input Field...........................]      │
│                                              │
│ Description                                  │
│ [Textarea...........................]        │
│ [...........................]               │
│ [...........................]               │
│                                              │
└──────────────────────────────────────────────┘

Spacing: 48px bottom
```

**Components:**
- Step Number Badge: 32px × 32px, rounded-full, Indigo background
- Card: White background, 1px border (Light Gray), 12px border radius, 32px padding
- Input Fields: 16px height, 12px border radius, 16px padding
- Focus State: 2px ring, Indigo color

---

### 3. Section 2: Layout Selection
```
┌──────────────────────────────────────────────────────────┐
│ ② Choose Layout                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│ │ [Preview]    │  │ [Preview]    │  │ [Preview]    │   │
│ │              │  │              │  │              │   │
│ │ Cards        │  │ Numbered     │  │ Timeline     │   │
│ │ Elegant card │  │ Numbered     │  │ Vertical     │   │
│ │ layout       │  │ list layout  │  │ timeline     │   │
│ └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘

Spacing: 48px bottom
```

**Layout Cards:**
- Width: 100% / 3 (responsive)
- Gap: 24px
- Card: Border 1px Light Gray
- Hover: Border Indigo/50, Background Light Gray
- Selected: Border Indigo, Background Indigo/50, Ring 1px Indigo
- Preview Area: Aspect Ratio 16:9, Background Light Slate
- Transition: 200ms smooth

---

### 4. Section 3: Reasons
```
┌──────────────────────────────────────────────┐
│ ③ Reasons                                    │
├──────────────────────────────────────────────┤
│                                              │
│ ┌────────────────────────────────────────┐  │
│ │ Reason 1                        Remove │  │
│ ├────────────────────────────────────────┤  │
│ │ Title                                  │  │
│ │ [Input...........................]      │  │
│ │                                        │  │
│ │ Description                            │  │
│ │ [Textarea....................]         │  │
│ │ [.................]                    │  │
│ │                                        │  │
│ │ Icon                                   │  │
│ │ [Input...........................]      │  │
│ └────────────────────────────────────────┘  │
│                                              │
│ + Add Another Reason                        │
│                                              │
└──────────────────────────────────────────────┘

Spacing: 48px bottom
```

**Reason Item:**
- Card: White background, Border 1px Light Gray, 12px radius, 24px padding
- Spacing between fields: 16px
- Remove Button: Text, Red color, Hover underline
- Add Button: Text + Icon, Indigo color, Hover underline

---

### 5. Section 4: Colors & Styling
```
┌─────────────────────────────────────────────────────────┐
│ ④ Colors & Styling                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [🎨] Background Color    [🎨] Card Background         │
│ [🎨] Title Color         [🎨] Subtitle Color          │
│ [🎨] Reason Title        [🎨] Reason Text             │
│                                                         │
└─────────────────────────────────────────────────────────┘

Spacing: 48px bottom
```

**Color Input:**
- Grid: 2-3 columns responsive
- Gap: 24px
- Color Picker: 48px × 48px, 8px border radius
- Label: Below color picker, 14px, Semibold

---

### 6. Action Buttons
```
┌──────────────────────────────────────────┐
│ [← Back to Services] [Generate Section →]│
└──────────────────────────────────────────┘

Spacing: 24px top (border)
```

**Button Styles:**

**Primary Button (Generate Section)**
- Background: Indigo (#4F46E5)
- Text: White, 14px, Semibold
- Padding: 16px × 32px
- Border Radius: 8px
- Hover: Background Indigo Light (#6366F1)
- Active: Scale 105%, Shadow 0 0 40px Indigo/50
- Transition: 300ms smooth

**Secondary Button (Back)**
- Background: Light Gray (#E5E7EB)
- Text: Dark Gray (#1F2937)
- Padding: 16px × 32px
- Border Radius: 8px
- Hover: Background Gray (#D1D5DB)

---

## 🎭 States & Interactions

### Form Input States
1. **Default**: Border Light Gray, Background White
2. **Hover**: Border Light Gray, Background White
3. **Focus**: Ring 2px Indigo, Border Indigo
4. **Filled**: Border Light Gray, Background White, Text Dark Gray
5. **Error**: Ring 2px Red, Border Red, Text Red

### Button States
1. **Default**: Base colors as above
2. **Hover**: Lighter shade, cursor pointer
3. **Active**: Scale up slightly, shadow effect
4. **Disabled**: Opacity 50%, cursor not-allowed

### Layout Card States
1. **Unselected**: Border Light Gray, Background White
2. **Hover**: Border Indigo/50, Background Light Gray
3. **Selected**: Border Indigo, Background Indigo/50, Ring Indigo

---

## 📏 Spacing System

- XS: 4px
- SM: 8px
- MD: 12px
- LG: 16px
- XL: 24px
- 2XL: 32px
- 3XL: 48px
- 4XL: 64px
- 5XL: 96px

---

## 🎬 Animations

### Transitions
- Default: 200ms ease-out
- Buttons: 300ms ease-out
- Colors: 300ms ease-out

### Effects
- Hover Scale: 1.05x for buttons
- Shadow on Click: 0 0 40px -10px Indigo
- Loading State: Spinning icon animation

---

## 📐 Grid & Alignment

### Desktop
- Columns: 12
- Gutter: 24px
- Layout sections: 2-3 columns
- Form inputs: 1-3 columns

### Tablet
- Columns: 6
- Gutter: 16px
- Layout sections: 2 columns
- Form inputs: 2 columns

### Mobile
- Columns: 1
- Gutter: 8px
- Layout sections: 1 column
- Form inputs: 1 column

---

## 🔍 Accessibility

- Minimum touch target: 44px × 44px
- Color contrast: WCAG AA (4.5:1 minimum)
- Focus indicators: Visible and clear
- Labels: Associated with inputs
- Semantic HTML: Proper heading hierarchy

---

## 📦 Figma Export Instructions

1. **Create New File** in Figma
2. **Set Frame**: Desktop (1440px × Auto)
3. **Import Components**:
   - Text Styles (using typography above)
   - Color Styles (using palette above)
   - Component Styles (buttons, inputs, cards)
4. **Create Pages**:
   - Desktop
   - Tablet
   - Mobile
5. **Export**: PNG for presentations, SVG for components

---

## 🎯 Key Design Principles

✅ **Clean & Modern**: Minimalist design with ample whitespace
✅ **User-Friendly**: Clear labels and intuitive flow
✅ **Responsive**: Mobile-first approach
✅ **Accessible**: WCAG compliant
✅ **Consistent**: Unified design system
✅ **Interactive**: Clear feedback on user actions
✅ **Professional**: Corporate color scheme

---

**Design File**: `Why_Choose_Us_Section_Creator.fig`
**Last Updated**: December 15, 2025
