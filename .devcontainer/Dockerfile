FROM node:lts-alpine
RUN apk add --no-cache zsh git vim zsh-autosuggestions zsh-syntax-highlighting bind-tools curl docker
RUN sh -c "$(wget https://raw.github.com/robbyrussell/oh-my-zsh/master/tools/install.sh -O -)"
RUN echo "source /usr/share/zsh/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh" >> ~/.zshrc && \
echo "source /usr/share/zsh/plugins/zsh-autosuggestions/zsh-autosuggestions.zsh" >> ~/.zshrc
CMD [ "sleep", "infinity" ]
EXPOSE 3000