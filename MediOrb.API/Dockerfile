# Use the official Microsoft .NET SDK image to build the app
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

# Copy the project file and restore dependencies
COPY *.csproj ./
RUN dotnet restore

# Copy the remaining files and build the app
COPY . ./
RUN dotnet publish -c Release -o out

# Use the official Microsoft .NET ASP.NET image for the runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/out ./

# Expose the port the app will run on (Render uses 8080 by default)
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

# For SQLite persistence on Render, we'll keep the DB in the /app folder 
# (Note: it will reset on restarts in the free tier)
ENTRYPOINT ["dotnet", "MediOrb.API.dll"]
