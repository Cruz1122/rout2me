export interface ButtonProps {
  text: string;
  variant?: 'primary' | 'secondary';
}

export class Button {
  constructor(private props: ButtonProps) {}

  render(): string {
    return `<button class="btn btn-${this.props.variant || 'primary'}">${this.props.text}</button>`;
  }
}

export const createButton = (props: ButtonProps): Button => {
  return new Button(props);
};
