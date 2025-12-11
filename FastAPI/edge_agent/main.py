"""
Edge Agent - Main entry point.

Usage:
    python -m edge_agent.main                    # Recognition mode
    python -m edge_agent.main --session <id>     # Attendance mode
    python -m edge_agent.main --help             # Show help
"""
import argparse
import logging
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from edge_agent.config import EdgeAgentConfig
from edge_agent.agent import EdgeAgent


def setup_logging(verbose: bool = False):
    """Setup logging configuration."""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%H:%M:%S'
    )


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Face Recognition Edge Agent',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python -m edge_agent.main                     # Start in recognition mode
  python -m edge_agent.main --session abc123    # Start with attendance session
  python -m edge_agent.main --camera 1          # Use camera index 1
  python -m edge_agent.main --no-preview        # Run without preview window
        """
    )
    
    parser.add_argument(
        '--session', '-s',
        type=str,
        default=None,
        help='Attendance session ID (enables attendance marking)'
    )
    
    parser.add_argument(
        '--camera', '-c',
        type=int,
        default=0,
        help='Camera index (default: 0)'
    )
    
    parser.add_argument(
        '--api-url',
        type=str,
        default='http://localhost:8000',
        help='API base URL (default: http://localhost:8000)'
    )
    
    parser.add_argument(
        '--api-key',
        type=str,
        default=None,
        help='API key for authentication'
    )
    
    parser.add_argument(
        '--fps',
        type=float,
        default=2.0,
        help='Frames per second to process (default: 2.0)'
    )
    
    parser.add_argument(
        '--no-preview',
        action='store_true',
        help='Disable preview window'
    )
    
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Enable verbose logging'
    )
    
    args = parser.parse_args()
    
    # Setup logging
    setup_logging(args.verbose)
    logger = logging.getLogger(__name__)
    
    # Create configuration
    config = EdgeAgentConfig()
    config.camera_id = args.camera
    config.api_base_url = args.api_url
    config.capture_fps = args.fps
    config.show_preview = not args.no_preview
    
    if args.api_key:
        config.api_key = args.api_key
    
    # Print startup info
    logger.info("=" * 50)
    logger.info("Face Recognition Edge Agent")
    logger.info("=" * 50)
    logger.info(f"API URL: {config.api_base_url}")
    logger.info(f"Camera: {config.camera_id}")
    logger.info(f"FPS: {config.capture_fps}")
    logger.info(f"Session: {args.session or 'None (recognition only)'}")
    logger.info("=" * 50)
    logger.info("Press 'q' to quit")
    logger.info("")
    
    # Create and start agent
    agent = EdgeAgent(config)
    
    try:
        agent.start(session_id=args.session)
    except Exception as e:
        logger.error(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
