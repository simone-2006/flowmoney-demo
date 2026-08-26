export default function Page({ title, icon = "", children, ...props }) {
    return (
        <div className="">
            <div className="flex items-center gap-1 px-2">
                {icon}
                <h1 className="font-bold text-2xl">{title}</h1>
            </div>
            <div className="p-2">{children}</div>
        </div>
    );
}