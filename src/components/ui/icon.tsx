export type IconName =
    | 'home'
    | 'box'
    | 'card'
    | 'repeat'
    | 'users'
    | 'plug'
    | 'settings'
    | 'team'
    | 'bell'
    | 'menu'
    | 'close'
    | 'arrow-up'
    | 'arrow-right'
    | 'chevron-down'
    | 'plus'
    | 'search'
    | 'check'
    | 'dots'
    | 'layout'
    | 'tag'
    | 'link'
    | 'cart'
    | 'chart'
    | 'refund'
    | 'webhook'
    | 'user'
    | 'code'
    | 'bolt'
    | 'edit'
    | 'trash'
    | 'clock'
    | 'image'
    | 'file'
    | 'folder'
    | 'download'
    | 'play'
    | 'sun'
    | 'moon';

const paths: Record<IconName, React.ReactNode> = {
    home: (
        <>
            <path d="m3 10 9-7 9 7" />
            <path d="M5 9v11h14V9" />
            <path d="M9 20v-6h6v6" />
        </>
    ),
    box: (
        <>
            <path d="m4 7 8-4 8 4-8 4-8-4Z" />
            <path d="M4 7v10l8 4 8-4V7" />
            <path d="M12 11v10" />
        </>
    ),
    card: (
        <>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 10h18" />
            <path d="M7 15h3" />
        </>
    ),
    repeat: (
        <>
            <path d="M17 2l3 3-3 3" />
            <path d="M4 11V9a4 4 0 0 1 4-4h12" />
            <path d="m7 22-3-3 3-3" />
            <path d="M20 13v2a4 4 0 0 1-4 4H4" />
        </>
    ),
    users: (
        <>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </>
    ),
    plug: (
        <>
            <path d="m12 22 2-2-4-4-2 2-2-2 2-2-4-4 2-2 4 4 2-2 4 4-2 2-2-2-2 2 4 4 2-2 2 2-2 2-2-2Z" />
        </>
    ),
    settings: (
        <>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.09A1.7 1.7 0 0 0 9 19.35a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1H3v-4h.09A1.7 1.7 0 0 0 4.65 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6h.02A1.7 1.7 0 0 0 10 3.09V3h4v.09A1.7 1.7 0 0 0 15 4.65a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9v.02A1.7 1.7 0 0 0 20.91 10H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z" />
        </>
    ),
    team: (
        <>
            <circle cx="9" cy="8" r="3" />
            <path d="M3 20v-2a5 5 0 0 1 10 0v2" />
            <path d="M16 4a3 3 0 0 1 0 6M16 14a5 5 0 0 1 5 5v1" />
        </>
    ),
    bell: (
        <>
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
        </>
    ),
    menu: (
        <>
            <path d="M4 7h16M4 12h16M4 17h16" />
        </>
    ),
    close: (
        <>
            <path d="m6 6 12 12M18 6 6 18" />
        </>
    ),
    'arrow-up': (
        <>
            <path d="m18 15-6-6-6 6" />
        </>
    ),
    'arrow-right': (
        <>
            <path d="M5 12h14M13 6l6 6-6 6" />
        </>
    ),
    'chevron-down': <path d="m7 10 5 5 5-5" />,
    plus: (
        <>
            <path d="M12 5v14M5 12h14" />
        </>
    ),
    search: (
        <>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
        </>
    ),
    check: (
        <>
            <path d="m5 12 4 4L19 6" />
        </>
    ),
    dots: (
        <>
            <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
            <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
        </>
    ),
    layout: (
        <>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 9v12" />
        </>
    ),
    tag: (
        <>
            <path d="M20.6 13.6 11 4H4v7l9.6 9.6a2 2 0 0 0 2.8 0l4.2-4.2a2 2 0 0 0 0-2.8Z" />
            <circle cx="7.5" cy="7.5" r="1" />
        </>
    ),
    link: (
        <>
            <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
            <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" />
        </>
    ),
    cart: (
        <>
            <circle cx="9" cy="20" r="1" />
            <circle cx="18" cy="20" r="1" />
            <path d="M3 4h2l2.4 10.5a2 2 0 0 0 2 1.5h7.7a2 2 0 0 0 2-1.6L21 7H6" />
        </>
    ),
    chart: (
        <>
            <path d="M4 20V10M10 20V4M16 20v-7M22 20V7" />
        </>
    ),
    refund: (
        <>
            <path d="M3 7v6h6" />
            <path d="M5.6 17a8 8 0 1 0 .5-10L3 10" />
            <path d="M12 8v4l3 2" />
        </>
    ),
    webhook: (
        <>
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="6" r="3" />
            <circle cx="18" cy="18" r="3" />
            <path d="m8.6 10.5 6.8-3M8.6 13.5l6.8 3" />
        </>
    ),
    user: (
        <>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" />
        </>
    ),
    code: (
        <>
            <path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14" />
        </>
    ),
    bolt: (
        <>
            <path d="m13 2-9 12h8l-1 8 9-12h-8l1-8Z" />
        </>
    ),
    edit: (
        <>
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
        </>
    ),
    trash: (
        <>
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6" />
            <path d="M10 11v5M14 11v5" />
        </>
    ),
    clock: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </>
    ),
    image: (
        <>
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-5-5L5 20" />
        </>
    ),
    file: (
        <>
            <path d="M6 2h8l4 4v16H6z" />
            <path d="M14 2v5h5M9 13h6M9 17h6" />
        </>
    ),
    folder: (
        <>
            <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2h6.5A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
        </>
    ),
    download: (
        <>
            <path d="M12 3v12M7 10l5 5 5-5" />
            <path d="M5 21h14" />
        </>
    ),
    play: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="m10 8 6 4-6 4V8Z" />
        </>
    ),
    sun: (
        <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
        </>
    ),
    moon: <path d="M20.5 14.4A8.5 8.5 0 0 1 9.6 3.5 8.5 8.5 0 1 0 20.5 14.4Z" />,
};

export function Icon({ name, className = 'size-5' }: { name: IconName; className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
            className={`${className} fill-none stroke-current`}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {paths[name]}
        </svg>
    );
}
