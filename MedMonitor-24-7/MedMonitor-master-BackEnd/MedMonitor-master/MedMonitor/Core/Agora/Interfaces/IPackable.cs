namespace MedMonitor.Core.Agora.Interfaces
{
    public interface IPackable
    {
        ByteBuf marshal(ByteBuf outBuf);
    }
}
