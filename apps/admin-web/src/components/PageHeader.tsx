import { colorClasses } from '../styles/colors';

interface PageHeaderProps {
  readonly title: string;
  readonly action?: React.ReactNode;
}

export default function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-[#dcdfe5]">
      <div className="flex flex-wrap justify-center items-center gap-3 p-6">
        <p
          className={`${colorClasses.textPrimary} tracking-light text-[32px] font-bold leading-tight text-center`}
        >
          {title}
        </p>
        {action && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2">
            {action}
          </div>
        )}
      </div>
    </header>
  );
}
